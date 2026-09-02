import { requireAdministratorRole } from '@/lib/auth/authorization';

export default async function AdminSchoolsPage() {
  await requireAdministratorRole('admin');

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">Iskolák</h1>
      <p className="mt-3 text-[#667085]">Az iskolakezelési műveletek a Phase 5 részei.</p>
    </section>
  );
}
