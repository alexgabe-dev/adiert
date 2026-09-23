import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistrationForm } from './RegistrationForm';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/features/teacher/actions', () => ({ teacherAuthAction: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

describe('registration school selection', () => {
  it('filters schools, keeps selection visible, and clears it on postal changes', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        cities: ['Nyíregyháza'],
        schools: [
          { id: 'school1', name: 'Arany János Iskola', city: 'Nyíregyháza' },
          { id: 'school2', name: 'Petőfi Iskola', city: 'Nyíregyháza' },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<RegistrationForm />);
    const submit = screen.getByRole('button', { name: 'Regisztráció beküldése' });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('Irányítószám'), '4400');
    await screen.findByRole('radio', { name: 'Arany János Iskola' });
    await user.type(screen.getByRole('searchbox'), 'arany');
    expect(screen.queryByRole('radio', { name: 'Petőfi Iskola' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Arany János Iskola' }));
    expect(submit).toBeEnabled();
    await user.clear(screen.getByLabelText('Irányítószám'));
    expect(submit).toBeDisabled();
    expect(screen.queryByText('Kiválasztva:')).not.toBeInTheDocument();
  });

  it('requires a town choice when the postal code belongs to multiple towns', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ cities: ['Település A', 'Település B'], schools: [] }),
      });
    vi.stubGlobal('fetch', fetcher);
    const user = userEvent.setup();
    render(<RegistrationForm />);
    await user.type(screen.getByLabelText('Irányítószám'), '1234');
    await screen.findByLabelText('Település');
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Település'), 'Település B');
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        expect.stringContaining('city=Telep%C3%BCl%C3%A9s+B'),
        expect.anything(),
      ),
    );
    expect(screen.getByRole('button', { name: 'Regisztráció beküldése' })).toBeDisabled();
  });

  it('shows a recoverable network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const user = userEvent.setup();
    render(<RegistrationForm />);
    await user.type(screen.getByLabelText('Irányítószám'), '4400');
    expect(await screen.findByRole('alert')).toHaveTextContent('A keresés most nem sikerült.');
    expect(screen.getByRole('button', { name: 'Újrapróbálom' })).toBeEnabled();
  });
});
