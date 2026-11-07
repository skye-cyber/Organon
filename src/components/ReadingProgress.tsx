import React from 'react';
import { useReaderStore } from '../store/readerStore';

export const ReadingProgress: React.FC = () => {
  const readingProgress = useReaderStore((state) => state.readingProgress);
  const isZenMode = useReaderStore((state) => state.isZenMode);

  if (isZenMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-50 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
      />
    </div>
  );
};
