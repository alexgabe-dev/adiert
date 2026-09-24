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
          p.error
            ? 'A belépési hivatkozás lejárt vagy érvénytelen. Kérj új e-mailt az alábbi lehetőségek egyikével.'
            : p.status === 'pending'
              ? 'A jelentkezésed a szervezők jóváhagyására vár. Az elfogadásról e-mailt kapsz a megerősítéshez szükséges linkkel.'
              : p.status === 'rejected'
                ? 'A jelentkezésedet nem fogadtuk el. A részleteket az értesítő e-mailben találod.'
                : p.status === 'paused'
                  ? 'Az iskolai hozzáférésed jelenleg szünetel.'
                  : undefined
        }
      />
    </>
  );
}
