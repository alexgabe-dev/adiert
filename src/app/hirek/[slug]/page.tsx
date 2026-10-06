import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ArticleContent } from '@/components/news/ArticleContent';
import { ArticleShare } from '@/components/news/ArticleShare';
import { articleDocument, firstArticleImage } from '@/features/news/content';
import { environment } from '@/lib/env';
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
  if (!article) return { title: 'Hír nem található' };
  const url = new URL(
    `/hirek/${encodeURIComponent(article.slug)}`,
    environment.SITE_URL,
  ).toString();
  const image = firstArticleImage(articleDocument(article.content));
  const images = image?.src
    ? [
        {
          url: image.src,
          alt: image.alt ?? article.title,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
        },
      ]
    : [];
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url,
      publishedTime: article.publishedAt,
      locale: 'hu_HU',
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: article.title,
      description: article.excerpt,
      images,
    },
  };
}

export default async function NewsArticlePage({ params }: NewsPageProps) {
  const article = await loadArticle((await params).slug);
  if (!article) notFound();

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
              <ArticleContent content={article.content} />
            </div>
            <ArticleShare
              title={article.title}
              url={new URL(
                `/hirek/${encodeURIComponent(article.slug)}`,
                environment.SITE_URL,
              ).toString()}
            />
          </article>
        </main>
        <Footer />
      </div>
    </ModalProvider>
  );
}
