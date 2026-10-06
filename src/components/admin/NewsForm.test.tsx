import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { NewsForm } from './NewsForm';
import { articleText, parseRichContent } from '@/features/news/content';

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
  expect(screen.getByText('Cikkelőnézet · a még nem mentett módosításokkal')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Szerkesztés' }));
  await waitFor(() => expect(screen.getByLabelText('Cikk címe')).toHaveValue('Ádiért összefogás!'));
  expect(screen.getByText('Nem mentett módosítások')).toBeVisible();
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
