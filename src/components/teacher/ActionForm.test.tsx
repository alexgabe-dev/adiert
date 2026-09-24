import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ActionForm, Field } from './ActionForm';
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe('form interaction', () => {
  it('keeps entered data after a server error so it can be corrected', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ status: 'error', message: 'Próbáld újra.' });
    render(
      <ActionForm action={action}>
        <Field label="Teljes név" name="name" />
      </ActionForm>,
    );
    await user.type(screen.getByLabelText('Teljes név'), 'Kiss Anna');
    await user.click(screen.getByRole('button', { name: 'Mentés' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Próbáld újra.'));
    expect(screen.getByLabelText('Teljes név')).toHaveValue('Kiss Anna');
    expect(screen.getByRole('alert')).toHaveFocus();
  });
  it('does not revoke access when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ status: 'success', message: 'Mentve.' });
    render(
      <ActionForm
        action={action}
        label="Visszavonás"
        tone="danger"
        confirm="Visszavonod Anna hozzáférését?"
      >
        <input type="hidden" name="id" value="anna" />
      </ActionForm>,
    );
    await user.click(screen.getByRole('button', { name: 'Visszavonás' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Anna');
    await user.click(screen.getByRole('button', { name: 'Mégsem' }));
    expect(action).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Visszavonás' }));
    await user.click(screen.getByRole('button', { name: 'Megerősítem' }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });
  it('can show and hide a password without submitting', async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(
      <ActionForm action={action}>
        <Field label="Jelszó" name="password" type="password" />
      </ActionForm>,
    );
    const input = screen.getByLabelText('Jelszó', { selector: 'input' });
    await user.type(input, 'TesztJelszo!');
    await user.click(screen.getByRole('button', { name: 'Jelszó megjelenítése' }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Jelszó elrejtése' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(action).not.toHaveBeenCalled();
  });
});
