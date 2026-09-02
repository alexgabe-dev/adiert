import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireActiveAdministrator } from '@/lib/auth/authorization';

interface ProtectedAdminLayoutProps {
  children: ReactNode;
}

export default async function ProtectedAdminLayout({ children }: ProtectedAdminLayoutProps) {
  const administrator = await requireActiveAdministrator();
  return <AdminShell administrator={administrator}>{children}</AdminShell>;
}
