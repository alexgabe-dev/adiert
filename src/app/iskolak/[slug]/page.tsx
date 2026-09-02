import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Coins, MapPin, Recycle, Trophy } from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ModalProvider } from '@/components/providers/ModalProvider';
import { SchoolProfileCta } from '@/components/schools/SchoolProfileCta';
import { getCachedSchoolProfile } from '@/features/public-data/repository';
import { schoolTypeLabels } from '@/features/public-data/types';

export const dynamic = 'force-dynamic';

interface SchoolPageProps {
  params: Promise<{ slug: string }>;
}

async function loadProfile(slug: string) {
  return getCachedSchoolProfile(slug);
}

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) return { title: 'Iskola nem található' };
  return {
    title: profile.name,
    description: `${profile.name} ellenőrzött Ádiért kampányeredménye — ${profile.city}, ${profile.county}.`,
  };
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();

  return (
    <ModalProvider>
      <div className="flex min-h-screen flex-col bg-[#F7F9FC] text-[#0B1535]">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-32 pb-16 sm:px-6 md:pt-40 lg:px-8">
          <Link href="/#ranglista" className="text-sm font-bold text-blue-600 hover:underline">
            ← Vissza a ranglistához
          </Link>
          <section className="mt-6 rounded-3xl border border-[#E8ECF2] bg-white p-6 shadow-xs sm:p-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold tracking-wide text-blue-700 uppercase">
                  {schoolTypeLabels[profile.type]}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1535] sm:text-4xl">
                  {profile.name}
                </h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-[#667085] sm:text-base">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {profile.city} · {profile.county}
                </p>
                <p className="mt-2 text-sm text-[#667085]">Aktív kampány: {profile.campaignName}</p>
              </div>
              {profile.rank > 0 ? (
                <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                  <Trophy className="h-7 w-7 text-amber-500" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold tracking-wide text-amber-800 uppercase">
                      Országos helyezés
                    </div>
                    <div className="text-2xl font-black text-amber-950">{profile.rank}.</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-blue-700 uppercase">
                  <Coins className="h-4 w-4" aria-hidden="true" /> Jóváhagyott összeg
                </div>
                <div className="mt-2 text-3xl font-black text-[#0B1535]">
                  {profile.approvedAmount.toLocaleString('hu-HU')} Ft
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-emerald-700 uppercase">
                  <Recycle className="h-4 w-4" aria-hidden="true" /> Jóváhagyott palackszám
                </div>
                <div className="mt-2 text-3xl font-black text-[#0B1535]">
                  {profile.approvedBottleCount.toLocaleString('hu-HU')} db
                </div>
              </div>
            </div>

            <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-[#667085]">
              A nyilvános értékek kizárólag kézi felülvizsgálat során jóváhagyott összegekből és
              palackszámokból készülnek. A függőben lévő vagy elutasított beküldések nem láthatók
              itt.
            </p>
            <div className="mt-6">
              <SchoolProfileCta school={profile} />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
