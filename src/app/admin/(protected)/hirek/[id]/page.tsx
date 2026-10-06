import { newsPublicationLabel } from '@/features/admin/news-publication';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';

import { AdminFlash } from '@/components/admin/AdminFlash';
import { NewsForm } from '@/components/admin/NewsForm';
import { saveNewsAction } from '@/features/admin/control-actions';
import { getNews } from '@/features/admin/control-center';
import { requireAdministratorRole } from '@/lib/auth/authorization';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface NewsItemPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function NewsItemPage({ params, searchParams }: NewsItemPageProps) {
  await requireAdministratorRole('admin');
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createServerSupabaseClient();
  if (!client) throw new Error('Admin database connection is unavailable');
  const [item, parameters] = await Promise.all([getNews(client, id), searchParams]);
  if (!item) notFound();
  return (
    <section className="mx-auto max-w-7xl">
      <Link href="/admin/hirek" className="text-sm font-bold text-blue-600">
        ← Hírek
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{item.title}</h1>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
        >
          {newsPublicationLabel(item)}
        </span>
      </div>
      <AdminFlash success={first(parameters.success)} error={first(parameters.error)} />
      <div className="mt-6">
        <NewsForm key={item.updated_at} action={saveNewsAction} item={item} />
      </div>
    </section>
  );
}
