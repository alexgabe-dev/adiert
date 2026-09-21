import type { ReactNode } from 'react';
import { requireTeacher } from '@/features/teacher/server';
import { TeacherShell } from '@/components/teacher/TeacherShell';
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: ReactNode }) {
  const { membership, school } = await requireTeacher();
  return (
    <TeacherShell school={school.name} name={membership.display_name}>
      {children}
    </TeacherShell>
  );
}
