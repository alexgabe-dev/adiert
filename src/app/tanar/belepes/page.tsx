import { AuthScreen } from '@/components/teacher/AuthScreen';
import { redirect } from 'next/navigation';
import { teacherSession } from '@/features/teacher/server';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; status?: string }>;
}) {
  const p = await searchParams;
  if (!p.mode && !p.error && (await teacherSession())) redirect('/tanar');
  return (
    <>
      <AuthScreen
        mode={p.mode === 'reset' ? 'reset' : p.mode === 'resend' ? 'resend' : 'login'}
        notice={
          p.status === 'pending'
            ? 'Az e-mail-címedet megerősítetted. Most a szervezők jóváhagyására vársz; az elfogadásról e-mailt kapsz, és utána tudsz belépni.'
            : p.status === 'rejected'
              ? 'A jelentkezésedet nem fogadtuk el. A részleteket az értesítő e-mailben találod.'
              : p.status === 'paused'
                ? 'Az iskolai hozzáférésed jelenleg szünetel.'
                : undefined
        }
      />
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
