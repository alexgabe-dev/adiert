import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ModalProvider } from '@/components/providers/ModalProvider';
import { getCachedPublishedNewsBySlug } from '@/features/public-data/repository';

export const dynamic = 'force-dynamic';

interface NewsPageProps {
  params: Promise<{ slug: string }>;
}

async function loadArticle(slug: string) {
  return getCachedPublishedNewsBySlug(slug);
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const article = await loadArticle((await params).slug);
  return article
    ? { title: article.title, description: article.excerpt }
    : { title: 'Hír nem található' };
}

export default async function NewsArticlePage({ params }: NewsPageProps) {
  const article = await loadArticle((await params).slug);
  if (!article) notFound();
  const paragraphs = article.content.split(/\r?\n\r?\n/).filter(Boolean);

  return (
    <ModalProvider>
      <div className="flex min-h-screen flex-col bg-[#F7F9FC] text-[#0B1535]">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-32 pb-16 sm:px-6 md:pt-40 lg:px-8">
          <Link href="/#hirek" className="text-sm font-bold text-blue-600 hover:underline">
            ← Vissza a főoldalra
          </Link>
          <article className="mt-6 rounded-3xl border border-[#E8ECF2] bg-white p-6 shadow-xs sm:p-10">
            <time
              dateTime={article.publishedAt}
              className="text-xs font-bold tracking-wide text-blue-600 uppercase"
            >
              {new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' }).format(
                new Date(article.publishedAt),
              )}
            </time>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-[#667085]">
              {article.excerpt}
            </p>
            <div className="mt-8 space-y-5 border-t border-slate-100 pt-8 text-sm leading-7 text-slate-700 sm:text-base">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
