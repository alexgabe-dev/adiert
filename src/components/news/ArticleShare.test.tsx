import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ArticleShare } from './ArticleShare';

const url = 'https://adiert.example/hirek/osszefogas';
it('opens platform-specific share URLs and copies the canonical article URL', async () => {
  const user = userEvent.setup();
  const clipboard = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(<ArticleShare title="Ádi & az iskolák" url={url} />);
  const facebook = new URL(
    screen.getByRole('link', { name: 'Megosztás: Facebook' }).getAttribute('href')!,
  );
  expect(facebook.searchParams.get('u')).toBe(url);
  const whatsapp = new URL(
    screen.getByRole('link', { name: 'Megosztás: WhatsApp' }).getAttribute('href')!,
  );
  expect(whatsapp.searchParams.get('text')).toBe(`Ádi & az iskolák\n${url}`);
  const linkedin = new URL(
    screen.getByRole('link', { name: 'Megosztás: LinkedIn' }).getAttribute('href')!,
  );
  expect(linkedin.searchParams.get('url')).toBe(url);
  for (const link of screen.getAllByRole('link'))
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await user.click(screen.getByRole('button', { name: 'Link másolása' }));
  expect(clipboard).toHaveBeenCalledWith(url);
  expect(screen.getByRole('status')).toHaveTextContent('Link másolva.');
});

it('provides a selectable URL when clipboard access is denied', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
  render(<ArticleShare title="Hír" url={url} />);
  await user.click(screen.getByRole('button', { name: 'Link másolása' }));
  expect(screen.getByLabelText('Cikk linkje')).toHaveValue(url);
  expect(screen.queryByText('Link másolva.')).not.toBeInTheDocument();
});
