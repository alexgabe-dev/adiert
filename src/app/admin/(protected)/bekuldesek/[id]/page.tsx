import { requireAdministratorRole } from '@/lib/auth/authorization';

export default async function AdminSubmissionPage() {
  await requireAdministratorRole('reviewer');

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">Beküldés részletei</h1>
      <p className="mt-3 text-[#667085]">A felülvizsgálati képernyő a Phase 3-ban készül el.</p>
    </section>
  );
}
