import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { environment } from '@/lib/env';
import { ViewportObserver } from '@/components/ui/ViewportObserver';

import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL(environment.SITE_URL),
  title: {
    default: 'Ádiért — Iskolai Palackgyűjtő Kampány',
    template: '%s | Ádiért',
  },
  description:
    'Gyűjtsetek palackokat az iskolátokkal Ádi kezeléséért. Útmutató a visszaváltáshoz, tanári feltöltés és közös eredmények.',
  openGraph: {
    title: 'Ádiért — Iskolai Palackgyűjtő Kampány',
    description:
      'Gyűjtsetek palackokat az iskolátokkal Ádi kezeléséért. Útmutató a visszaváltáshoz, tanári feltöltés és közös eredmények.',
    locale: 'hu_HU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ádiért — Iskolai Palackgyűjtő Kampány',
    description:
      'Gyűjtsetek palackokat az iskolátokkal Ádi kezeléséért. Útmutató a visszaváltáshoz, tanári feltöltés és közös eredmények.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
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
        <ViewportObserver />
        {children}
      </body>
    </html>
  );
}
