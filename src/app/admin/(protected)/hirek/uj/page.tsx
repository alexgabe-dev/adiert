import Link from 'next/link';

import { AdminFlash } from '@/components/admin/AdminFlash';
import { NewsForm } from '@/components/admin/NewsForm';
import { saveNewsAction } from '@/features/admin/control-actions';
import { requireAdministratorRole } from '@/lib/auth/authorization';

interface NewNewsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function NewNewsPage({ searchParams }: NewNewsPageProps) {
  await requireAdministratorRole('admin');
  const parameters = await searchParams;
  return (
    <section className="mx-auto max-w-7xl">
      <Link href="/admin/hirek" className="text-sm font-bold text-blue-600">
        ← Hírek
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Új hír</h1>
      <AdminFlash success={first(parameters.success)} error={first(parameters.error)} />
      <div className="mt-6">
        <NewsForm action={saveNewsAction} />
      </div>
    </section>
  );
}
