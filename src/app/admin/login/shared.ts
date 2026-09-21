export interface SignInState {
  status: 'idle' | 'error' | 'sent';
  message: string;
}

export const initialSignInState: SignInState = { status: 'idle', message: '' };
