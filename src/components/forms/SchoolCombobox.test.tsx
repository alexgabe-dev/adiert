import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SchoolCombobox } from '@/components/forms/SchoolCombobox';

describe('SchoolCombobox', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('waits for two characters, searches remotely, and selects an immutable school ID by keyboard', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        results: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Árvíztűrő Iskola',
            city: 'Őriszentpéter',
            county: 'Vas',
          },
        ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SchoolCombobox
        campaignId="11111111-1111-4111-8111-111111111111"
        value={null}
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'a');
    expect(fetchMock).not.toHaveBeenCalled();
    await user.type(input, 'r');
    await screen.findByRole('option', { name: /Árvíztűrő Iskola/ });
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: '22222222-2222-4222-8222-222222222222' }),
    );
    expect(window.localStorage.getItem('adiert.recent-school-id')).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
  });

  it('renders the selected school and location without loading a large option list', () => {
    render(
      <SchoolCombobox
        campaignId="11111111-1111-4111-8111-111111111111"
        value={{
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Hosszú Iskolanév',
          city: 'Hosszú településnév',
          county: 'Vármegye',
        }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Hosszú Iskolanév')).toBeInTheDocument();
    expect(screen.getByText('Hosszú településnév · Vármegye')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});
