'use client';

import { Camera } from 'lucide-react';

import { useModalActions } from '@/components/providers/ModalProvider';
import type { SchoolSelection } from '@/features/public-data/types';

export function SchoolProfileCta({ school }: { school: SchoolSelection }) {
  const { openSubmit } = useModalActions();
  return (
    <button
      type="button"
      onClick={() => openSubmit(school)}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Camera className="h-4 w-4" aria-hidden="true" />
      Képernyőfotó beküldése ehhez az iskolához
    </button>
  );
}
