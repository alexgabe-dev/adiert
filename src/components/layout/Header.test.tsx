import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';
vi.mock('@/components/providers/ModalProvider', () => ({
  useModalActions: () => ({ openRegister: vi.fn(), openSubmit: vi.fn() }),
}));
describe('mobile navigation', () => {
  it('locks background scrolling, traps focus, and restores the opener on escape', async () => {
    const user = userEvent.setup();
    render(<Header />);
    const opener = screen.getByRole('button', { name: 'Menü megnyitása' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog).getByRole('button', { name: 'Menü bezárása' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: 'Iskola csatlakoztatása' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();
  });
  it('closes the drawer after selecting a destination', async () => {
    const user = userEvent.setup();
    render(<Header />);
    await user.click(screen.getByRole('button', { name: 'Menü megnyitása' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Ranglista' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });
});
