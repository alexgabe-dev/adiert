import 'server-only';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { MAX_NEWS_IMAGE_BYTES, NEWS_IMAGE_TYPES } from './image-shared';

const BUCKET = 'news-images';

export class NewsImageError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function normalizeNewsImage(file: {
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
}) {
  if (!file.size) throw new NewsImageError('Válassz egy képet.');
  if (file.size > MAX_NEWS_IMAGE_BYTES)
    throw new NewsImageError('A kép legfeljebb 4 MB lehet.', 413);
  if (!(NEWS_IMAGE_TYPES as readonly string[]).includes(file.type))
    throw new NewsImageError('JPG, PNG vagy WebP képet válassz.');
  const source = Buffer.from(await file.arrayBuffer());
  if (source.length > MAX_NEWS_IMAGE_BYTES)
    throw new NewsImageError('A kép legfeljebb 4 MB lehet.', 413);
  const detected = await fileTypeFromBuffer(source);
  if (!detected || detected.mime !== file.type) throw new NewsImageError('Érvénytelen képfájl.');
  try {
    const image = sharp(source, { failOn: 'error', limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if ((metadata.pages ?? 1) !== 1) throw new NewsImageError('Állóképet válassz.');
    const { data, info } = await image
      .autoOrient()
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    if (data.length > MAX_NEWS_IMAGE_BYTES)
      throw new NewsImageError('A kép legfeljebb 4 MB lehet.', 413);
    return { buffer: data, width: info.width, height: info.height };
  } catch (error) {
    if (error instanceof NewsImageError) throw error;
    throw new NewsImageError('A kép nem olvasható, vagy túl nagy a felbontása.');
  }
}

export async function storeNewsImage(
  client: SupabaseClient,
  userId: string,
  image: Awaited<ReturnType<typeof normalizeNewsImage>>,
) {
  // Provision only the dedicated article-media bucket. Existing buckets and
  // private receipt storage are never changed. Writes remain server-only.
  let { data: bucket } = await client.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await client.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_NEWS_IMAGE_BYTES,
      allowedMimeTypes: ['image/webp'],
    });
    if (error) {
      // Another request may have created it in the meantime.
      const result = await client.storage.getBucket(BUCKET);
      bucket = result.data;
      if (!bucket) throw error;
    }
  }
  if (bucket && !bucket.public) throw new Error('News media bucket is not public');
  const path = `${userId}/${randomUUID()}.webp`;
  const storage = client.storage.from(BUCKET);
  const { error } = await storage.upload(path, image.buffer, {
    contentType: 'image/webp',
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return {
    url: storage.getPublicUrl(path).data.publicUrl,
    width: image.width,
    height: image.height,
  };
}
