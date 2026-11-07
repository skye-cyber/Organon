import React, { useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';
import { Minimize, Sparkles } from 'lucide-react';

export const ZenModeControls: React.FC = () => {
  const isZenMode = useReaderStore((state) => state.isZenMode);
  const setZenMode = useReaderStore((state) => state.setZenMode);

  // Keyboard shortcut listener to toggle or exit zen mode with Esc or Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (isZenMode && e.key === 'Escape') {
        e.preventDefault();
        setZenMode(false);
      } else if (e.key === 'z' || e.key === 'Z') {
        // Toggle Zen Mode
        e.preventDefault();
        setZenMode(!isZenMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, setZenMode]);

  if (!isZenMode) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-popover)]/90 backdrop-blur-md border border-[var(--border-color)] shadow-[var(--shadow-soft)] text-xs text-[var(--text-secondary)]">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span className="font-medium text-[var(--text-primary)]">Focus Mode</span>
        <span className="text-[var(--text-muted)]">•</span>
        <button
          onClick={() => setZenMode(false)}
          className="flex items-center gap-1 text-[var(--accent-gold)] hover:underline font-semibold"
        >
          <Minimize className="w-3 h-3" />
          <span>Exit (Esc / Z)</span>
        </button>
      </div>
    </div>
  );
};
