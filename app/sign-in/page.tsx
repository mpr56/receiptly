import SignInForm from "./SignInForm";

/**
 * Server shell. Reading the callback's error flag here rather than with
 * useSearchParams keeps the form out of a Suspense boundary.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <SignInForm callbackFailed={error === "auth"} />;
}
