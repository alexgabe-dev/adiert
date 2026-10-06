import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { NewsForm } from './NewsForm';
import { articleText, parseRichContent } from '@/features/news/content';

afterEach(() => vi.unstubAllGlobals());

// JSDOM has no layout engine; ProseMirror reads selection geometry on focus.
const originalRects = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects');
const originalBounds = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect');
beforeAll(() => {
  Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(),
  });
});
afterAll(() => {
  if (originalRects) Object.defineProperty(Range.prototype, 'getClientRects', originalRects);
  else Reflect.deleteProperty(Range.prototype, 'getClientRects');
  if (originalBounds)
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', originalBounds);
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
});

it('generates a slug, respects a custom URL and previews the current draft', async () => {
  const user = userEvent.setup();
  render(<NewsForm action={vi.fn()} />);
  expect(screen.queryByText('Készen áll a megjelenésre?')).not.toBeInTheDocument();
  expect(screen.queryByText('Egy történet, ami számít')).not.toBeInTheDocument();
  await screen.findByRole('textbox', { name: 'Cikk szövege' });
  fireEvent.change(screen.getByLabelText('Cikk címe'), { target: { value: 'Ádiért összefogás' } });
  expect(screen.getByLabelText('URL-ben szereplő név')).toHaveValue('adiert-osszefogas');
  fireEvent.change(screen.getByLabelText('URL-ben szereplő név'), {
    target: { value: 'egyedi-cim' },
  });
  fireEvent.change(screen.getByLabelText('Cikk címe'), { target: { value: 'Ádiért összefogás!' } });
  expect(screen.getByLabelText('URL-ben szereplő név')).toHaveValue('egyedi-cim');
  fireEvent.change(screen.getByLabelText('Bevezető / kivonat'), {
    target: { value: 'Együtt segítünk.' },
  });
  await user.click(screen.getByRole('button', { name: 'Előnézet' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ádiért összefogás!');
  expect(screen.getByText('Cikkelőnézet')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Szerkesztés' }));
  await waitFor(() => expect(screen.getByLabelText('Cikk címe')).toHaveValue('Ádiért összefogás!'));
  expect(screen.getByText('Nem mentett módosítások')).toBeVisible();
});

it('uploads a file, prevents saving during upload, and preserves the image in preview and saved content', async () => {
  const user = userEvent.setup();
  const action = vi.fn<(data: FormData) => Promise<void>>().mockResolvedValue(undefined);
  let complete!: (value: { ok: boolean; json: () => Promise<unknown> }) => void;
  const fetch = vi.fn(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  vi.stubGlobal('fetch', fetch);
  render(<NewsForm action={action} />);
  await screen.findByRole('textbox', { name: 'Cikk szövege' });
  fireEvent.change(screen.getByLabelText('Cikk címe'), { target: { value: 'Képes cikk' } });
  fireEvent.change(screen.getByLabelText('Bevezető / kivonat'), { target: { value: 'Kivonat' } });
  await user.click(screen.getByRole('button', { name: 'Kép beszúrása' }));
  await user.upload(
    screen.getByLabelText('Kép feltöltése'),
    new File(['png'], 'photo.png', { type: 'image/png' }),
  );
  expect(screen.getByRole('button', { name: 'Piszkozat mentése' })).toBeDisabled();
  await act(async () =>
    complete({
      ok: true,
      json: async () => ({ url: 'https://storage.example/photo.webp', width: 1600, height: 900 }),
    }),
  );
  expect(fetch).toHaveBeenCalledWith(
    '/api/admin/news/images',
    expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
  );
  fireEvent.change(screen.getByLabelText('Kép leírása'), { target: { value: 'Iskolai gyűjtés' } });
  fireEvent.change(screen.getByLabelText('Képaláírás (opcionális)'), {
    target: { value: 'Október' },
  });
  await user.click(screen.getByRole('button', { name: 'Beszúrás' }));
  await user.click(screen.getByRole('button', { name: 'Előnézet' }));
  const image = screen.getByRole('img', { name: 'Iskolai gyűjtés' });
  expect(image).toHaveAttribute('width', '1600');
  expect(image).toHaveAttribute('height', '900');
  expect(screen.getByText('Október')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Piszkozat mentése' }));
  await waitFor(() => expect(action).toHaveBeenCalledOnce());
  const doc = parseRichContent(String(action.mock.calls[0]?.[0].get('content')));
  expect(doc?.content?.find((node) => node.type === 'image')?.attrs).toMatchObject({
    src: 'https://storage.example/photo.webp',
    width: 1600,
    height: 900,
  });
});

it('converts a legacy article to rich text, saves formatting and keeps it in preview', async () => {
  const user = userEvent.setup();
  const action = vi.fn<(data: FormData) => Promise<void>>().mockResolvedValue(undefined);
  render(
    <NewsForm
      action={action}
      item={{
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Régi cikk',
        slug: 'regi-cikk',
        excerpt: 'Kivonat',
        content: 'Eredeti szöveg',
        published: false,
        published_at: null,
        updated_at: '2026-10-06T10:00:00Z',
      }}
    />,
  );
  await screen.findByRole('textbox', { name: 'Cikk szövege' });
  await user.selectOptions(screen.getByRole('combobox', { name: 'Bekezdés stílusa' }), '2');
  await user.click(screen.getByRole('button', { name: 'Előnézet' }));
  expect(screen.getByRole('heading', { name: 'Eredeti szöveg', level: 2 })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Piszkozat mentése' }));
  await waitFor(() => expect(action).toHaveBeenCalledOnce());
  const form = action.mock.calls[0]?.[0];
  const doc = parseRichContent(String(form?.get('content')));
  expect(doc?.content?.[0]?.type).toBe('heading');
  expect(articleText(doc!)).toContain('Eredeti szöveg');
  expect(form?.get('published')).toBeNull();
});
