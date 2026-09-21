import type { Metadata } from 'next';
import type { ReactNode } from 'react';
export const metadata: Metadata = {
  title: 'Iskolai csapat · Ádiért',
  robots: { index: false, follow: false },
};
export default function TeacherLayout({ children }: { children: ReactNode }) {
  return children;
}
