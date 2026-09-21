'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { SchoolSelection } from '@/features/public-data/types';

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

type ActiveModal = { type: 'guide' } | { type: 'leaderboard' } | null;

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
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const closeModal = useCallback(() => setActiveModal(null), []);
  const openGuide = useCallback(() => setActiveModal({ type: 'guide' }), []);
  const openLeaderboard = useCallback(() => setActiveModal({ type: 'leaderboard' }), []);
  const openRegister = useCallback(() => router.push('/tanar/regisztracio'), [router]);
  const openSubmit = useCallback(() => router.push('/tanar/feltoltes'), [router]);

  const actions = useMemo(
    () => ({ closeModal, openGuide, openLeaderboard, openRegister, openSubmit }),
    [closeModal, openGuide, openLeaderboard, openRegister, openSubmit],
  );

  return (
    <ModalActionsContext.Provider value={actions}>
      {children}
      {activeModal?.type === 'guide' && (
        <GuideModal isOpen onClose={closeModal} onOpenSubmitModal={openSubmit} />
      )}
      {activeModal?.type === 'leaderboard' && (
        <FullLeaderboardModal isOpen onClose={closeModal} onSelectSchool={openSubmit} />
      )}
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
