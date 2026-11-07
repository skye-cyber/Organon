import React from 'react';
import { useReaderStore } from '../store/readerStore';
import { Command, X, Keyboard } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const isKeyboardModalOpen = useReaderStore((state) => state.isKeyboardModalOpen);
  const setKeyboardModalOpen = useReaderStore((state) => state.setKeyboardModalOpen);

  if (!isKeyboardModalOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl / ⌘', 'F'], desc: 'Open Full-Text & Semantic Search' },
    { keys: ['Ctrl / ⌘', '\\'], desc: 'Toggle Table of Contents sidebar' },
    { keys: ['Ctrl / ⌘', 'M'], desc: 'Toggle Notes & Marginalia panel' },
    { keys: ['Z'], desc: 'Toggle Zen Focus Mode' },
    { keys: ['J', 'K'], desc: 'Scroll to Next / Previous paragraph' },
    { keys: ['T'], desc: 'Open Typography & Theme settings' },
    { keys: ['Esc'], desc: 'Close open dialogs or exit Zen Mode' },
    { keys: ['?'], desc: 'Open this keyboard shortcuts reference' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[var(--bg-popover)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4.5 h-4.5 text-[var(--accent-gold)]" />
            <h3 className="font-title-classical font-semibold text-xs tracking-wider uppercase text-[var(--text-primary)]">
              Keyboard Navigation
            </h3>
          </div>
          <button
            onClick={() => setKeyboardModalOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 divide-y divide-[var(--border-subtle)] max-h-[65vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">{s.desc}</span>
              <div className="flex items-center gap-1 font-mono">
                {s.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold shadow-2xs"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/30 text-center text-[11px] text-[var(--text-muted)]">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono">Esc</kbd> anytime to dismiss.
        </div>
      </div>
    </div>
  );
};
