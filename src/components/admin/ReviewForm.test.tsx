import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReviewForm } from './ReviewForm';
const { review } = vi.hoisted(() => ({
  review: vi.fn().mockResolvedValue({ status: 'success', message: 'Mentve.' }),
}));
vi.mock('@/features/admin/review-action', () => ({ reviewSubmissionAction: review }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const props = {
  submissionId: 'test',
  version: 1,
  status: 'pending' as const,
  detectedAmount: 5000,
  detectedBottleCount: 100,
  detectedReceiptIdentifier: null,
  detectedReceiptDate: null,
};
describe('review decisions', () => {
  it('requires teacher-readable feedback for a correction and retains entered feedback', async () => {
    const user = userEvent.setup();
    review.mockClear();
    render(<ReviewForm {...props} />);
    await user.click(screen.getByRole('button', { name: 'Javítást kérek' }));
    expect(screen.getByRole('alert')).toHaveTextContent('tanár is látni fogja');
    expect(review).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText('Visszajelzés a tanárnak'),
      'Kérlek, tölts fel egy élesebb fotót.',
    );
    await user.click(screen.getByRole('button', { name: 'Javítást kérek' }));
    await waitFor(() => expect(review).toHaveBeenCalledOnce());
  });
  it('does not let a reviewer change a final result', () => {
    render(<ReviewForm {...props} status="approved" canCorrect={false} />);
    expect(screen.queryByRole('button', { name: 'Jóváhagyás' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Vissza az ellenőrzési listához' }),
    ).toBeInTheDocument();
  });
});
