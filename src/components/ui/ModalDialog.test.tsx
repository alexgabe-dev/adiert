import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { ModalDialog } from './ModalDialog';

function ModalHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Megnyitás
      </button>
      {isOpen && (
        <ModalDialog labelId="test-dialog-title" onClose={() => setIsOpen(false)}>
          <h2 id="test-dialog-title">Teszt párbeszédablak</h2>
          <button type="button">Első művelet</button>
          <button type="button" onClick={() => setIsOpen(false)}>
            Bezárás
          </button>
        </ModalDialog>
      )}
    </>
  );
}

describe('ModalDialog', () => {
  it('exposes dialog semantics, locks scroll, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    const trigger = screen.getByRole('button', { name: 'Megnyitás' });
    trigger.focus();
    await user.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Teszt párbeszédablak' })).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('cycles focus within the dialog', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);

    await user.click(screen.getByRole('button', { name: 'Megnyitás' }));
    const firstAction = screen.getByRole('button', { name: 'Első művelet' });
    const closeButton = screen.getByRole('button', { name: 'Bezárás' });

    firstAction.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(firstAction).toHaveFocus();
  });
});
