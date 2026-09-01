-- Receiptly: receipts table, private image bucket, RLS, and the two query
-- functions the app reads through.
--
-- The design principle throughout: there is no stored per-user list of receipt
-- ids. Every row carries its own user_id and the ledger is a query over an
-- index, so it paginates in constant time regardless of how many receipts a
-- user has accumulated.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
-- Columns for what gets filtered, sorted and aggregated; JSONB for the line
-- items, which are read whole and almost never queried field-by-field.
--
-- storeColor and storeLogoInitials are deliberately absent: both derive from
-- store_name (lib/data.ts), and persisting them would freeze existing rows at
-- whatever the palette said the day they were written.

create table if not exists public.receipts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,

  store_name     text not null,
  category       text not null,
  purchased_at   timestamptz not null,
  total_amount   numeric(12, 2) not null,
  currency       text not null default 'AUD',
  payment_method text not null check (payment_method in ('cash', 'card', 'digital')),
  tags           text[] not null default '{}',
  notes          text,

  items          jsonb not null default '[]'::jsonb,

  -- A storage path, not a URL. Signed URLs expire; paths don't.
  image_path     text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists receipts_touch_updated_at on public.receipts;
create trigger receipts_touch_updated_at
  before update on public.receipts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Full-text search
-- ---------------------------------------------------------------------------
-- The app's search box reaches inside line items, so item names are indexed
-- alongside the store, category and tags.
--
-- Every expression here is IMMUTABLE, which a generated column requires:
--   * to_tsvector(regconfig, text) — immutable in its two-argument form
--   * jsonb_path_query_array       — immutable (only the _tz variants are stable)
--   * array_to_tsvector            — immutable, and avoids array_to_string,
--                                    which is only STABLE and would be rejected

alter table public.receipts
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector('english', coalesce(store_name, '') || ' ' || coalesce(category, ''))
    || array_to_tsvector(tags)
    || to_tsvector('english', coalesce(jsonb_path_query_array(items, '$[*].name')::text, ''))
  ) stored;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
-- One per sort field, each led by user_id so a user's slice is a contiguous
-- range scan. The trailing id makes each ordering total, which is what lets
-- keyset pagination seek without ever skipping or repeating a row.

create index if not exists receipts_user_date_idx
  on public.receipts (user_id, purchased_at desc, id desc);
create index if not exists receipts_user_amount_idx
  on public.receipts (user_id, total_amount desc, id desc);
create index if not exists receipts_user_store_idx
  on public.receipts (user_id, store_name, id);
create index if not exists receipts_user_category_idx
  on public.receipts (user_id, category, purchased_at desc);
create index if not exists receipts_search_idx
  on public.receipts using gin (search_tsv);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
-- The app never uses a service-role key, so this policy — not application
-- diligence — is what keeps one user's receipts away from another's.

alter table public.receipts enable row level security;

-- Supabase's project-level default privileges usually cover this, but stating
-- it here means the migration does not depend on that being in place.
grant select, insert, update, delete on public.receipts to authenticated;

drop policy if exists receipts_owner on public.receipts;
create policy receipts_owner on public.receipts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Search query builder
-- ---------------------------------------------------------------------------
-- The old client-side search was a substring match, so "mil" found "Milk".
-- Plain full-text search is word-based and would not, so each term becomes a
-- prefix match. Input is reduced to alphanumeric words first, which means no
-- user input can reach to_tsquery as syntax.

create or replace function public.receipt_search_query(p_search text)
returns tsquery
language sql
immutable
as $$
  select case
    when coalesce(trim(p_search), '') = '' then null
    else to_tsquery('english', nullif((
      select string_agg(quote_literal(w) || ':*', ' & ')
      from regexp_split_to_table(
             regexp_replace(lower(p_search), '[^a-z0-9]+', ' ', 'g'),
             '\s+'
           ) as w
      where w <> ''
    ), ''))
  end;
$$;

-- ---------------------------------------------------------------------------
-- list_receipts — one page of the ledger
-- ---------------------------------------------------------------------------
-- Keyset pagination, not OFFSET: offset makes the database walk and discard
-- every row before the page, so deep pages get progressively slower. Seeking
-- past a cursor costs the same at page 2 and page 200.
--
-- SECURITY INVOKER, so the RLS policy above still applies inside the function
-- and no user_id filter is needed (or trusted) here.

create or replace function public.list_receipts(
  p_search       text   default null,
  p_categories   text[] default null,
  p_sort         text   default 'date',
  p_cursor_value text   default null,
  p_cursor_id    uuid   default null,
  p_limit        int    default 50
)
returns setof public.receipts
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_col  text;
  v_dir  text;
  v_cast text;
  v_cmp  text;
begin
  -- p_sort is interpolated into SQL below, so it is whitelisted rather than
  -- escaped: anything unrecognised falls through to the default ordering.
  case p_sort
    when 'amount' then v_col := 'total_amount';  v_dir := 'desc'; v_cast := 'numeric';
    when 'store'  then v_col := 'store_name';    v_dir := 'asc';  v_cast := 'text';
    else               v_col := 'purchased_at';  v_dir := 'desc'; v_cast := 'timestamptz';
  end case;

  -- Descending order seeks backwards through the index, ascending forwards.
  v_cmp := case when v_dir = 'desc' then '<' else '>' end;

  return query execute format(
    'select r.*
       from public.receipts r
      where ($1 is null or r.search_tsv @@ $1)
        and ($2 is null or r.category = any($2))
        and ($4 is null or (r.%1$I, r.id) %2$s ($3::%3$s, $4))
      order by r.%1$I %4$s, r.id %4$s
      limit $5',
    v_col, v_cmp, v_cast, v_dir
  )
  using
    public.receipt_search_query(p_search),
    p_categories,
    p_cursor_value,
    p_cursor_id,
    greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

-- ---------------------------------------------------------------------------
-- receipt_stats — the X-report figures
-- ---------------------------------------------------------------------------
-- StatsBar used to sum the array it was handed. Once the ledger is paginated
-- that array is one page, so the totals have to be computed over the whole
-- filtered set here instead.

create or replace function public.receipt_stats(
  p_search     text   default null,
  p_categories text[] default null
)
returns table (
  receipt_count  bigint,
  total_spend    numeric,
  avg_basket     numeric,
  largest_amount numeric,
  largest_store  text,
  total_count    bigint
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with filtered as (
    select r.store_name, r.total_amount
      from public.receipts r
     where (public.receipt_search_query(p_search) is null
            or r.search_tsv @@ public.receipt_search_query(p_search))
       and (p_categories is null or r.category = any(p_categories))
  ),
  largest as (
    select store_name, total_amount
      from filtered
     order by total_amount desc
     limit 1
  )
  select
    (select count(*) from filtered),
    coalesce((select sum(total_amount) from filtered), 0),
    coalesce((select avg(total_amount) from filtered), 0),
    (select total_amount from largest),
    (select store_name from largest),
    -- Unfiltered, for the "N OF M ON FILE" line. RLS scopes it to this user.
    (select count(*) from public.receipts);
$$;

grant execute on function public.receipt_search_query(text) to authenticated;
grant execute on function public.list_receipts(text, text[], text, text, uuid, int) to authenticated;
grant execute on function public.receipt_stats(text, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Image storage
-- ---------------------------------------------------------------------------
-- Private bucket, objects at {user_id}/{receipt_id}.jpg. The user id leads the
-- path so the policy can authorise on it directly.
--
-- Deliberately last, and deliberately non-fatal. On a hosted project the SQL
-- Editor runs this whole file in one transaction, and creating a policy on
-- storage.objects needs rights the editor's role does not always have. If that
-- raised here, it would roll back the entire schema above it — table,
-- functions and all — leaving a project that looks like nothing ran. Instead
-- the failure is caught and reported, and the policy can be added through
-- Storage → Policies in the dashboard.

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', false)
  on conflict (id) do nothing;
exception when others then
  raise warning 'Could not create the "receipts" storage bucket (%). Create it manually: Storage → New bucket → name "receipts", NOT public.', sqlerrm;
end;
$$;

do $$
begin
  execute 'drop policy if exists receipts_storage_owner on storage.objects';
  execute $policy$
    create policy receipts_storage_owner on storage.objects
      for all
      to authenticated
      using (
        bucket_id = 'receipts'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'receipts'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
  $policy$;
exception when others then
  raise warning 'Could not create the storage policy (%). Add it via Storage → Policies on the "receipts" bucket, matching: (storage.foldername(name))[1] = auth.uid()::text', sqlerrm;
end;
$$;
