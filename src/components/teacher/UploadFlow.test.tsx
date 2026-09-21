import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadFlow } from './UploadFlow';
vi.mock('@/lib/confetti', () => ({ launchConfetti: vi.fn() }));
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: true }) });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe('teacher upload experience', () => {
  it('requires a photo before proceeding', async () => {
    const user = userEvent.setup();
    render(<UploadFlow school="Teszt Iskola" />);
    await user.click(screen.getByRole('button', { name: 'Tovább' }));
    expect(screen.getByRole('alert')).toHaveTextContent('képernyőfotót');
  });
  it('keeps the selected photo and count after a network failure, retries with the same key and only celebrates saved uploads', async () => {
    const user = userEvent.setup();
    const { container } = render(<UploadFlow school="Teszt Iskola" />);
    const input = container.querySelector('input[type=file]:not([capture])') as HTMLInputElement;
    await user.upload(input, new File(['photo'], 'screen.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: 'Tovább' }));
    await user.type(screen.getByLabelText('Hány palackot váltottatok vissza?'), '120');
    await user.click(screen.getByRole('button', { name: 'Tovább' }));
    fetchMock.mockRejectedValueOnce(new Error('network'));
    await user.click(screen.getByRole('button', { name: 'Beküldöm ellenőrzésre' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('adataid megmaradtak'));
    expect(screen.queryByText('Ez szép munka volt!')).not.toBeInTheDocument();
    expect(screen.getByText('120 palack')).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicReference: 'saved-ref', status: 'pending' }),
    });
    await user.click(screen.getByRole('button', { name: 'Beküldöm ellenőrzésre' }));
    await waitFor(() => expect(screen.getByText('Ez szép munka volt!')).toBeInTheDocument());
    expect(fetchMock.mock.calls[0]?.[1].headers['Idempotency-Key']).toBe(
      fetchMock.mock.calls[1]?.[1].headers['Idempotency-Key'],
    );
    const payload = fetchMock.mock.calls[1]?.[1].body as FormData;
    expect(payload.get('count')).toBe('120');
    expect(payload.has('school_id')).toBe(false);
  });
});
