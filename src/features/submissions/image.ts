import 'server-only';

import { createHash } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

import {
  acceptedReceiptMimeTypes,
  MAX_RECEIPT_DIMENSION,
  MAX_RECEIPT_FILE_BYTES,
  MAX_RECEIPT_PIXELS,
  MIN_RECEIPT_DIMENSION,
} from '@/features/submissions/constants';

export type ReceiptImageErrorCode =
  'missing_image' | 'unsupported_type' | 'oversized_file' | 'invalid_image' | 'invalid_dimensions';

export class ReceiptImageError extends Error {
  constructor(public readonly code: ReceiptImageErrorCode) {
    super(code);
    this.name = 'ReceiptImageError';
  }
}

export interface ReceiptUpload {
  arrayBuffer: () => Promise<ArrayBuffer>;
  size: number;
  type: string;
}

export interface NormalizedReceiptImage {
  buffer: Buffer;
  contentType: 'image/jpeg';
  extension: 'jpg';
  sha256: string;
  width: number;
  height: number;
}

function isAcceptedMimeType(value: string): value is (typeof acceptedReceiptMimeTypes)[number] {
  return acceptedReceiptMimeTypes.includes(value as (typeof acceptedReceiptMimeTypes)[number]);
}

export async function normalizeReceiptImage(
  upload: ReceiptUpload | null,
): Promise<NormalizedReceiptImage> {
  if (!upload || upload.size === 0) {
    throw new ReceiptImageError('missing_image');
  }

  if (upload.size > MAX_RECEIPT_FILE_BYTES) {
    throw new ReceiptImageError('oversized_file');
  }

  if (!isAcceptedMimeType(upload.type)) {
    throw new ReceiptImageError('unsupported_type');
  }

  const sourceBuffer = Buffer.from(await upload.arrayBuffer());
  const detectedType = await fileTypeFromBuffer(sourceBuffer);

  if (
    !detectedType ||
    !isAcceptedMimeType(detectedType.mime) ||
    detectedType.mime !== upload.type
  ) {
    throw new ReceiptImageError('unsupported_type');
  }

  try {
    const image = sharp(sourceBuffer, {
      failOn: 'error',
      limitInputPixels: MAX_RECEIPT_PIXELS,
      sequentialRead: true,
    });
    const metadata = await image.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (
      width < MIN_RECEIPT_DIMENSION ||
      height < MIN_RECEIPT_DIMENSION ||
      width > MAX_RECEIPT_DIMENSION ||
      height > MAX_RECEIPT_DIMENSION ||
      width * height > MAX_RECEIPT_PIXELS ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new ReceiptImageError('invalid_dimensions');
    }

    const normalizedBuffer = await image
      .autoOrient()
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toBuffer();

    if (normalizedBuffer.length > MAX_RECEIPT_FILE_BYTES) {
      throw new ReceiptImageError('oversized_file');
    }

    return {
      buffer: normalizedBuffer,
      contentType: 'image/jpeg',
      extension: 'jpg',
      sha256: createHash('sha256').update(normalizedBuffer).digest('hex'),
      width,
      height,
    };
  } catch (error) {
    if (error instanceof ReceiptImageError) {
      throw error;
    }
    throw new ReceiptImageError('invalid_image');
  }
}
