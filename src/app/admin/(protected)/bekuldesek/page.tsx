import { requireAdministratorRole } from '@/lib/auth/authorization';

export default async function AdminSubmissionsPage() {
  await requireAdministratorRole('reviewer');

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">Beküldések</h1>
      <p className="mt-3 text-[#667085]">
        A védett felülvizsgálati sor a Phase 3 része. A Phase 2-ben közvetlen adatbázis-módosítás
        nem engedélyezett.
      </p>
    </section>
  );
}
