// @vitest-environment node

import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { MAX_RECEIPT_FILE_BYTES } from '@/features/submissions/constants';
import {
  normalizeReceiptImage,
  ReceiptImageError,
  type ReceiptUpload,
} from '@/features/submissions/image';

function upload(buffer: Buffer, type: string, size = buffer.length): ReceiptUpload {
  return {
    size,
    type,
    arrayBuffer: async () => Uint8Array.from(buffer).buffer,
  };
}

async function expectImageError(promise: Promise<unknown>, code: ReceiptImageError['code']) {
  await expect(promise).rejects.toMatchObject({ name: 'ReceiptImageError', code });
}

describe('normalizeReceiptImage', () => {
  it.each([
    ['image/jpeg', 'jpeg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ] as const)('normalizes a real %s upload to a metadata-free JPEG', async (mime, format) => {
    const source = await sharp({
      create: { width: 600, height: 800, channels: 4, background: '#fff2cc' },
    })
      .withMetadata({ orientation: 6, exif: { IFD0: { Artist: 'must be stripped' } } })
      .toFormat(format)
      .toBuffer();

    const result = await normalizeReceiptImage(upload(source, mime));
    const metadata = await sharp(result.buffer).metadata();

    expect(result.contentType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.format).toBe('jpeg');
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
  });

  it('rejects a missing image', async () => {
    await expectImageError(normalizeReceiptImage(null), 'missing_image');
  });

  it('rejects a declared image whose bytes have another signature', async () => {
    const png = await sharp({
      create: { width: 400, height: 400, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();

    await expectImageError(normalizeReceiptImage(upload(png, 'image/jpeg')), 'unsupported_type');
  });

  it('rejects unsupported and corrupt file content', async () => {
    await expectImageError(
      normalizeReceiptImage(upload(Buffer.from('not-an-image'), 'application/pdf')),
      'unsupported_type',
    );
    await expectImageError(
      normalizeReceiptImage(upload(Buffer.from('not-an-image'), 'image/jpeg')),
      'unsupported_type',
    );
  });

  it('rejects oversized files before reading their body', async () => {
    const arrayBuffer = vi.fn<ReceiptUpload['arrayBuffer']>();
    await expectImageError(
      normalizeReceiptImage({
        size: MAX_RECEIPT_FILE_BYTES + 1,
        type: 'image/jpeg',
        arrayBuffer,
      }),
      'oversized_file',
    );
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it('rejects images below the minimum dimensions', async () => {
    const tiny = await sharp({
      create: { width: 100, height: 100, channels: 3, background: '#ffffff' },
    })
      .jpeg()
      .toBuffer();
    await expectImageError(normalizeReceiptImage(upload(tiny, 'image/jpeg')), 'invalid_dimensions');
  });
});
