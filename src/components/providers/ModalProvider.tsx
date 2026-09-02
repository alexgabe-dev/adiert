'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { SchoolSelection } from '@/features/public-data/types';

const SubmitReceiptModal = dynamic(
  () =>
    import('@/components/modals/SubmitReceiptModal').then((module) => module.SubmitReceiptModal),
  { ssr: false },
);
const GuideModal = dynamic(
  () => import('@/components/modals/GuideModal').then((module) => module.GuideModal),
  { ssr: false },
);
const FullLeaderboardModal = dynamic(
  () =>
    import('@/components/modals/FullLeaderboardModal').then(
      (module) => module.FullLeaderboardModal,
    ),
  { ssr: false },
);
const SchoolRegisterModal = dynamic(
  () =>
    import('@/components/modals/SchoolRegisterModal').then((module) => module.SchoolRegisterModal),
  { ssr: false },
);

type ActiveModal =
  | { type: 'submit'; school: SchoolSelection | null }
  | { type: 'guide' }
  | { type: 'leaderboard' }
  | { type: 'register' }
  | null;

interface ModalActions {
  closeModal: () => void;
  openGuide: () => void;
  openLeaderboard: () => void;
  openRegister: () => void;
  openSubmit: (school?: SchoolSelection) => void;
}

const ModalActionsContext = createContext<ModalActions | null>(null);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const closeModal = useCallback(() => setActiveModal(null), []);
  const openGuide = useCallback(() => setActiveModal({ type: 'guide' }), []);
  const openLeaderboard = useCallback(() => setActiveModal({ type: 'leaderboard' }), []);
  const openRegister = useCallback(() => setActiveModal({ type: 'register' }), []);
  const openSubmit = useCallback(
    (school?: SchoolSelection) => setActiveModal({ type: 'submit', school: school ?? null }),
    [],
  );

  const actions = useMemo(
    () => ({ closeModal, openGuide, openLeaderboard, openRegister, openSubmit }),
    [closeModal, openGuide, openLeaderboard, openRegister, openSubmit],
  );

  return (
    <ModalActionsContext.Provider value={actions}>
      {children}
      {activeModal?.type === 'submit' && (
        <SubmitReceiptModal isOpen onClose={closeModal} defaultSchool={activeModal.school} />
      )}
      {activeModal?.type === 'guide' && (
        <GuideModal isOpen onClose={closeModal} onOpenSubmitModal={openSubmit} />
      )}
      {activeModal?.type === 'leaderboard' && (
        <FullLeaderboardModal isOpen onClose={closeModal} onSelectSchool={openSubmit} />
      )}
      {activeModal?.type === 'register' && <SchoolRegisterModal isOpen onClose={closeModal} />}
    </ModalActionsContext.Provider>
  );
}

export function useModalActions() {
  const context = useContext(ModalActionsContext);

  if (!context) {
    throw new Error('useModalActions must be used within ModalProvider');
  }

  return context;
}
