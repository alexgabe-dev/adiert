import { AuthScreen } from '@/components/teacher/AuthScreen';
import { redirect } from 'next/navigation';
import { teacherSession } from '@/features/teacher/server';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const p = await searchParams;
  if (!p.mode && !p.error && (await teacherSession())) redirect('/tanar');
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
