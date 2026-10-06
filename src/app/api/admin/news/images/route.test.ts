// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  origin: vi.fn(),
  admin: vi.fn(),
  client: vi.fn(),
  normalize: vi.fn(),
  store: vi.fn(),
}));
vi.mock('@/lib/security/origin', () => ({ hasValidMutationOrigin: mocks.origin }));
vi.mock('@/lib/auth/authorization', () => ({ getActiveAdministrator: mocks.admin }));
vi.mock('@/lib/supabase/admin', () => ({ createPrivilegedSupabaseClient: mocks.client }));
vi.mock('@/features/news/image', async (load) => ({
  ...(await load<typeof import('@/features/news/image')>()),
  normalizeNewsImage: mocks.normalize,
  storeNewsImage: mocks.store,
}));
import { POST } from './route';
import { MAX_NEWS_IMAGE_BYTES } from '@/features/news/image-shared';

function request() {
  const body = new FormData();
  body.set('image', new File(['image bytes'], 'photo.png', { type: 'image/png' }));
  return new NextRequest('https://example.com/api/admin/news/images', { method: 'POST', body });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockResolvedValue(true);
  mocks.admin.mockResolvedValue({ userId: 'admin-id', role: 'admin' });
  mocks.client.mockReturnValue({});
  mocks.normalize.mockResolvedValue({ buffer: Buffer.from('webp'), width: 800, height: 600 });
  mocks.store.mockResolvedValue({ url: 'https://example.com/photo.webp', width: 800, height: 600 });
});

it('stores an authenticated admin upload and returns its URL and dimensions', async () => {
  const result = await POST(request());
  expect(result.status).toBe(201);
  expect(await result.json()).toEqual({
    url: 'https://example.com/photo.webp',
    width: 800,
    height: 600,
  });
  expect(mocks.store).toHaveBeenCalledWith({}, 'admin-id', expect.objectContaining({ width: 800 }));
});

it.each([null, { userId: 'reviewer', role: 'reviewer' }])(
  'rejects unauthorized access %j before storage access',
  async (admin) => {
    mocks.admin.mockResolvedValue(admin);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
  },
);

it('rejects cross-origin requests', async () => {
  mocks.origin.mockResolvedValue(false);
  expect((await POST(request())).status).toBe(403);
  expect(mocks.admin).not.toHaveBeenCalled();
});

it('bounds the actual body even without Content-Length', async () => {
  const req = new NextRequest('https://example.com/api/admin/news/images', {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=test' },
    body: new Uint8Array(MAX_NEWS_IMAGE_BYTES + 65537),
  });
  expect((await POST(req)).status).toBe(413);
  expect(mocks.normalize).not.toHaveBeenCalled();
});

it('returns a recoverable error when storage is unavailable', async () => {
  mocks.store.mockRejectedValueOnce(new Error('storage failure'));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'A képfeltöltés nem sikerült. Próbáld újra.' });
});
