import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { TeacherMessageComposer } from './TeacherMessageComposer';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/features/admin/portal-actions', () => ({ sendTeacherMessage: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());
it('keeps the draft and selected recipients while searching, and requires review', async () => {
  const first = { id: 'a', name: 'Anna Tanár', email: 'anna@example.test', school: 'Iskola A' };
  const second = { id: 'b', name: 'Béla Tanár', email: 'bela@example.test', school: 'Iskola B' };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        recipients: url.includes('B%C3%A9la') ? [second] : [first],
        truncated: false,
      }),
    })),
  );
  const user = userEvent.setup();
  render(
    <TeacherMessageComposer recipients={[first]} messageId="test-message" truncated={false} />,
  );
  await user.click(screen.getByRole('checkbox'));
  await user.type(screen.getByLabelText('Tárgy'), 'Gyűjtési nap');
  await user.type(screen.getByLabelText('Üzenet'), 'Holnap újra gyűjtünk az iskolában.');
  await user.type(screen.getByLabelText('Tanár keresése'), 'Béla');
  await screen.findByText('Béla Tanár');
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeEnabled());
  await user.click(screen.getByRole('checkbox'));
  expect(screen.getByLabelText('Tárgy')).toHaveValue('Gyűjtési nap');
  expect(screen.getByText('2 kiválasztva')).toBeInTheDocument();
  const send = screen.getByRole('button', { name: 'Üzenet elküldése' });
  expect(send).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Küldés előtti ellenőrzés' }));
  expect(send).toBeEnabled();
  expect(screen.getByRole('region', { name: 'Üzenet előnézete' })).toHaveTextContent(
    'Anna Tanár, Béla Tanár',
  );
  await user.type(screen.getByLabelText('Üzenet'), ' Köszönjük!');
  expect(send).toBeDisabled();
});
