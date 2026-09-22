export interface ReviewActionState {
  status: 'idle' | 'error' | 'success';
  message: string;
}

export const initialReviewActionState: ReviewActionState = { status: 'idle', message: '' };
