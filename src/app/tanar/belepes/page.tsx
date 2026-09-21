import { AuthScreen } from '@/components/teacher/AuthScreen';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const p = await searchParams;
  return (
    <>
      <AuthScreen mode={p.mode === 'reset' ? 'reset' : p.mode === 'resend' ? 'resend' : 'login'} />
      {p.error && (
        <p
          role="alert"
          className="fixed top-3 right-3 left-3 rounded-xl bg-rose-100 p-4 text-center text-sm text-rose-900"
        >
          A belépési hivatkozás lejárt vagy érvénytelen. Kérj új e-mailt.
        </p>
      )}
    </>
  );
}
