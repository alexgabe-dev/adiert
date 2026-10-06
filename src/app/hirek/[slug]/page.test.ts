// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/env', () => ({ environment: { SITE_URL: 'https://adiert.example' } }));
const article = vi.hoisted(() => vi.fn());
vi.mock('@/features/public-data/repository', () => ({ getCachedPublishedNewsBySlug: article }));
import { generateMetadata } from './page';
import { RICH_TEXT_PREFIX } from '@/features/news/content';

it('uses the article title, excerpt and first image in social metadata', async () => {
  article.mockResolvedValue({
    title: 'Képes cikk',
    slug: 'kepes-cikk',
    excerpt: 'Kivonat',
    publishedAt: '2026-10-06T10:00:00Z',
    content:
      RICH_TEXT_PREFIX +
      JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: {
              src: 'https://storage.example/photo.webp',
              alt: 'Gyűjtés',
              width: 1600,
              height: 900,
            },
          },
        ],
      }),
  });
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'kepes-cikk' }) });
  expect(metadata.alternates?.canonical).toBe('https://adiert.example/hirek/kepes-cikk');
  expect(metadata.openGraph).toMatchObject({
    type: 'article',
    title: 'Képes cikk',
    description: 'Kivonat',
    images: [
      { url: 'https://storage.example/photo.webp', width: 1600, height: 900, alt: 'Gyűjtés' },
    ],
  });
  expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: 'Képes cikk' });
});

it('supports existing text-only articles without inheriting unrelated social images', async () => {
  article.mockResolvedValue({
    title: 'Régi cikk',
    slug: 'regi-cikk',
    excerpt: 'Kivonat',
    publishedAt: '2026-10-06T10:00:00Z',
    content: 'Régi szöveg',
  });
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: 'regi-cikk' }) });
  expect(metadata.openGraph).toMatchObject({ title: 'Régi cikk', images: [] });
  expect(metadata.twitter).toMatchObject({ card: 'summary' });
});
