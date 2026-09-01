-- Development seed. Run it AFTER signing in with Google once: it attaches to
-- the first user in auth.users, and there is no user until then.
--
--   supabase db reset          (applies migrations, then runs this)
--   psql "$DB_URL" -f supabase/seed.sql
--
-- Re-runnable: every row it writes is tagged notes = 'seed' and cleared first.
-- image_path stays null, so these receipts exercise the no-photo path too.

do $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users order by created_at limit 1;

  if v_user is null then
    raise notice 'No user in auth.users yet — sign in with Google once, then re-run this seed.';
    return;
  end if;

  delete from public.receipts where user_id = v_user and notes = 'seed';

  -- The eight receipts the UI was built against, so the ledger looks like
  -- itself: varied merchants, categories, tender types and basket sizes.
  insert into public.receipts
    (user_id, store_name, category, purchased_at, total_amount, currency, payment_method, tags, notes, items)
  values
    (v_user, 'Woolworths', 'Groceries', '2026-05-28T10:23:00+10', 87.45, 'AUD', 'card', '{weekly-shop}', 'seed',
     '[{"name":"Full Cream Milk 2L","quantity":2,"unitPrice":3.2,"totalPrice":6.4},
       {"name":"Sourdough Bread","quantity":1,"unitPrice":5.5,"totalPrice":5.5},
       {"name":"Free Range Eggs 12pk","quantity":1,"unitPrice":7.9,"totalPrice":7.9},
       {"name":"Chicken Breast 500g","quantity":2,"unitPrice":10.0,"totalPrice":20.0},
       {"name":"Broccoli","quantity":1,"unitPrice":3.5,"totalPrice":3.5},
       {"name":"Greek Yogurt 500g","quantity":1,"unitPrice":5.2,"totalPrice":5.2},
       {"name":"Orange Juice 1L","quantity":2,"unitPrice":4.9,"totalPrice":9.8}]'::jsonb),

    (v_user, 'JB Hi-Fi', 'Electronics', '2026-05-24T14:11:00+10', 249.00, 'AUD', 'card', '{gadgets}', 'seed',
     '[{"name":"Sony WH-1000XM5 Headphones","quantity":1,"unitPrice":249.0,"totalPrice":249.0}]'::jsonb),

    (v_user, 'McDonald''s', 'Food & Dining', '2026-05-27T19:45:00+10', 22.70, 'AUD', 'digital', '{lunch}', 'seed',
     '[{"name":"Big Mac Meal Large","quantity":1,"unitPrice":14.5,"totalPrice":14.5},
       {"name":"McFlurry Oreo","quantity":1,"unitPrice":5.2,"totalPrice":5.2},
       {"name":"Apple Pie","quantity":1,"unitPrice":3.0,"totalPrice":3.0}]'::jsonb),

    (v_user, 'Chemist Warehouse', 'Health & Pharmacy', '2026-05-20T11:30:00+10', 54.30, 'AUD', 'card', '{health}', 'seed',
     '[{"name":"Vitamin D3 1000IU 200 tabs","quantity":1,"unitPrice":18.99,"totalPrice":18.99},
       {"name":"Magnesium 300mg 60 tabs","quantity":1,"unitPrice":22.5,"totalPrice":22.5},
       {"name":"Ibuprofen 200mg 24pk","quantity":1,"unitPrice":6.99,"totalPrice":6.99},
       {"name":"Band-Aid Assorted 30pk","quantity":1,"unitPrice":5.79,"totalPrice":5.79}]'::jsonb),

    (v_user, 'Coles', 'Groceries', '2026-05-15T09:12:00+10', 63.20, 'AUD', 'card', '{weekly-shop}', 'seed',
     '[{"name":"Pasta 500g x3","quantity":3,"unitPrice":2.5,"totalPrice":7.5},
       {"name":"Canned Tomatoes 400g x4","quantity":4,"unitPrice":1.8,"totalPrice":7.2},
       {"name":"Olive Oil 750ml","quantity":1,"unitPrice":12.0,"totalPrice":12.0},
       {"name":"Salmon Fillet 400g","quantity":2,"unitPrice":13.0,"totalPrice":26.0}]'::jsonb),

    (v_user, 'Uber Eats', 'Food & Dining', '2026-05-22T20:10:00+10', 41.85, 'AUD', 'digital', '{takeaway}', 'seed',
     '[{"name":"Pad Thai Chicken","quantity":2,"unitPrice":16.9,"totalPrice":33.8},
       {"name":"Spring Rolls x4","quantity":1,"unitPrice":8.0,"totalPrice":8.0},
       {"name":"Delivery Fee","quantity":1,"unitPrice":0.05,"totalPrice":0.05}]'::jsonb),

    (v_user, 'Bunnings', 'Home & Garden', '2026-05-10T08:45:00+10', 138.60, 'AUD', 'card', '{home}', 'seed',
     '[{"name":"Paint Roller Kit","quantity":1,"unitPrice":24.98,"totalPrice":24.98},
       {"name":"Interior Wall Paint 4L","quantity":2,"unitPrice":48.0,"totalPrice":96.0},
       {"name":"Sandpaper Assorted 10pk","quantity":1,"unitPrice":9.98,"totalPrice":9.98}]'::jsonb),

    (v_user, 'Apple Store', 'Electronics', '2026-04-30T16:00:00+10', 1699.00, 'AUD', 'card', '{tech,big-purchase}', 'seed',
     '[{"name":"MacBook Air M3 13-inch 16GB","quantity":1,"unitPrice":1699.0,"totalPrice":1699.0}]'::jsonb);

  -- Bulk rows so pagination has something to page through: 200 receipts across
  -- 200 days, spread over merchants, categories and tender types.
  insert into public.receipts
    (user_id, store_name, category, purchased_at, total_amount, currency, payment_method, tags, notes, items)
  select
    v_user, g.store, g.cat, g.ts, g.amt, 'AUD', g.pay, '{bulk}', 'seed',
    jsonb_build_array(
      jsonb_build_object('name', 'Sundries', 'quantity', 1, 'unitPrice', g.amt, 'totalPrice', g.amt)
    )
  from (
    select
      (array['Woolworths','Coles','ALDI','Kmart','Bunnings',
             '7-Eleven','Netflix','Uber Eats','JB Hi-Fi','Apple Store'])[1 + (i % 10)] as store,
      (array['Groceries','Food & Dining','Electronics','Home & Garden','Entertainment',
             'Transportation','Services','Health & Pharmacy'])[1 + (i % 8)] as cat,
      now() - (i || ' days')::interval as ts,
      -- Deterministic but scattered, so amount sorting has no ties to hide
      -- ordering bugs behind.
      round((5 + (i * 7919 % 24000) / 100.0)::numeric, 2) as amt,
      (array['card','cash','digital'])[1 + (i % 3)] as pay
    from generate_series(1, 200) as i
  ) g;

  raise notice 'Seeded 208 receipts for user %', v_user;
end;
$$;
