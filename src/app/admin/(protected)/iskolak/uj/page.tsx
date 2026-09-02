import Link from 'next/link';

import { AdminFlash } from '@/components/admin/AdminFlash';
import { SchoolForm } from '@/components/admin/SchoolForm';
import { createSchoolAction } from '@/features/admin/control-actions';
import { requireAdministratorRole } from '@/lib/auth/authorization';

interface NewSchoolPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function NewSchoolPage({ searchParams }: NewSchoolPageProps) {
  await requireAdministratorRole('admin');
  const parameters = await searchParams;
  return (
    <section className="max-w-4xl">
      <Link href="/admin/iskolak" className="text-sm font-bold text-blue-600">
        ← Iskolák
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Új iskola</h1>
      <p className="mt-2 text-sm text-[#667085]">Az új iskola aktív állapotban jön létre.</p>
      <AdminFlash success={first(parameters.success)} error={first(parameters.error)} />
      <div className="mt-6 rounded-2xl border border-[#E8ECF2] bg-white p-5 sm:p-6">
        <SchoolForm action={createSchoolAction} />
      </div>
    </section>
  );
}
