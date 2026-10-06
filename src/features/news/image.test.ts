// @vitest-environment node
import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { normalizeNewsImage, storeNewsImage } from './image';
import { MAX_NEWS_IMAGE_BYTES } from './image-shared';

describe('article images', () => {
  it.each(['jpeg', 'png', 'webp'] as const)(
    'normalizes %s, bounds dimensions and removes metadata',
    async (format) => {
      const source = await sharp({
        create: { width: 3000, height: 1500, channels: 3, background: '#123456' },
      })
        .withMetadata({ exif: { IFD0: { Artist: 'private' } } })
        .toFormat(format)
        .toBuffer();
      const image = await normalizeNewsImage({
        size: source.length,
        type: `image/${format}`,
        arrayBuffer: async () => Uint8Array.from(source).buffer,
      });
      const metadata = await sharp(image.buffer).metadata();
      expect(image).toMatchObject({ width: 2400, height: 1200 });
      expect(metadata.format).toBe('webp');
      expect(metadata.exif).toBeUndefined();
    },
  );

  it('rejects oversized input without reading it, and rejects disguised non-images', async () => {
    const arrayBuffer = vi.fn(async () => new ArrayBuffer(0));
    await expect(
      normalizeNewsImage({ size: MAX_NEWS_IMAGE_BYTES + 1, type: 'image/png', arrayBuffer }),
    ).rejects.toMatchObject({ status: 413 });
    expect(arrayBuffer).not.toHaveBeenCalled();
    await expect(
      normalizeNewsImage({
        size: 10,
        type: 'image/png',
        arrayBuffer: async () => Uint8Array.from(Buffer.from('<svg></svg>')).buffer,
      }),
    ).rejects.toThrow('Érvénytelen képfájl');
  });

  it('creates only its own public bucket and returns an immutable public image URL', async () => {
    const storage = {
      getBucket: vi.fn().mockResolvedValue({ data: null }),
      createBucket: vi.fn().mockResolvedValue({ error: null }),
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn((path: string) => ({
        data: { publicUrl: `https://storage.example/${path}` },
      })),
    };
    const image = { buffer: Buffer.from('normalized'), width: 800, height: 600 };
    const result = await storeNewsImage(
      { storage } as unknown as SupabaseClient,
      'admin-id',
      image,
    );
    expect(storage.createBucket).toHaveBeenCalledWith('news-images', {
      public: true,
      fileSizeLimit: MAX_NEWS_IMAGE_BYTES,
      allowedMimeTypes: ['image/webp'],
    });
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^admin-id\/[a-f0-9-]+\.webp$/),
      image.buffer,
      expect.objectContaining({ contentType: 'image/webp', upsert: false }),
    );
    expect(result).toMatchObject({ width: 800, height: 600 });
    expect(result.url).toMatch(/^https:\/\/storage.example\/admin-id\//);
  });

  it('handles concurrent bucket creation without changing a private bucket', async () => {
    const storage = {
      getBucket: vi
        .fn()
        .mockResolvedValueOnce({ data: null })
        .mockResolvedValueOnce({ data: { public: true } }),
      createBucket: vi.fn().mockResolvedValue({ error: new Error('already exists') }),
      from: vi.fn().mockReturnThis(),
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi
        .fn()
        .mockReturnValue({ data: { publicUrl: 'https://storage.example/image.webp' } }),
    };
    const client = { storage } as unknown as SupabaseClient;
    const image = { buffer: Buffer.from('image'), width: 800, height: 600 };
    await expect(storeNewsImage(client, 'admin', image)).resolves.toHaveProperty('url');
    storage.getBucket.mockResolvedValue({ data: { public: false } });
    storage.upload.mockClear();
    await expect(storeNewsImage(client, 'admin', image)).rejects.toThrow('not public');
    expect(storage.upload).not.toHaveBeenCalled();
  });
});
