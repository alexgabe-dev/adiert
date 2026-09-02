export const RECEIPT_BUCKET = 'receipt-images';
export const MAX_RECEIPT_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_RECEIPT_PIXELS = 40_000_000;
export const MAX_RECEIPT_DIMENSION = 12_000;
export const MIN_RECEIPT_DIMENSION = 200;
export const SIGNED_RECEIPT_URL_TTL_SECONDS = 60;

export const acceptedReceiptMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
