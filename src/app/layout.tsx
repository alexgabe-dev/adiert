import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { environment } from '@/lib/env';

import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(environment.NEXT_PUBLIC_SITE_URL),
  title: {
    default: 'Ádiért — Iskolai Palackgyűjtő Kampány',
    template: '%s | Ádiért',
  },
  description:
    'Gamifikált iskolai palackgyűjtő és adományozó platform a MOHU REpont rendszerével Ádi támogatásáért.',
  openGraph: {
    title: 'Ádiért — Iskolai Palackgyűjtő Kampány',
    description:
      'Gamifikált iskolai palackgyűjtő és adományozó platform a MOHU REpont rendszerével Ádi támogatásáért.',
    locale: 'hu_HU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ádiért — Iskolai Palackgyűjtő Kampány',
    description:
      'Gamifikált iskolai palackgyűjtő és adományozó platform a MOHU REpont rendszerével Ádi támogatásáért.',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="hu" className={plusJakartaSans.variable}>
      <body className="bg-white font-sans text-[#0B1535] antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
