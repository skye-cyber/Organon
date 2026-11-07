import React, { useRef, useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';
import { ThemeMode, FontFamily, MaxWidthMode } from '../types';
import {
  Sun,
  Moon,
  Coffee,
  Type,
  AlignLeft,
  Minimize2,
  Maximize2,
  X,
  Trash2,
} from 'lucide-react';

interface TypographyPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
}

export const TypographyPopover: React.FC<TypographyPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const theme = useReaderStore((state) => state.theme);
  const setTheme = useReaderStore((state) => state.setTheme);
  const typography = useReaderStore((state) => state.typography);
  const updateTypography = useReaderStore((state) => state.updateTypography);
  const highlights = useReaderStore((state) => state.highlights);
  const clearAllHighlights = useReaderStore((state) => state.clearAllHighlights);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed top-14 right-6 w-80 bg-[var(--bg-popover)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-soft)] p-5 z-50 text-[var(--text-primary)] transition-all animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[var(--accent-gold)]" />
          <h3 className="font-semibold text-sm tracking-wide">Typography & View</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4.5 pt-3">
        {/* Theme Selectors */}
        <div>
          <label className="text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)] mb-2 block">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                theme === 'light'
                  ? 'border-[var(--accent-gold)] bg-amber-500/10 text-amber-900 font-semibold'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Light
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                theme === 'sepia'
                  ? 'border-[var(--accent-gold)] bg-amber-700/10 text-amber-900 font-semibold'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-700" />
              Sepia
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                theme === 'dark'
                  ? 'border-[var(--accent-gold)] bg-yellow-400/10 text-yellow-300 font-semibold'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-yellow-400" />
              Dark
            </button>
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)] mb-2 block">
            Typeface
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'serif', label: 'Classical', font: 'font-organon-serif' },
                { id: 'sans', label: 'Modern', font: 'font-organon-sans' },
                { id: 'mono', label: 'Scholarly', font: 'font-organon-mono' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => updateTypography({ fontFamily: item.id as FontFamily })}
                className={`py-2 px-2 text-xs text-center rounded-lg border transition-all ${item.font} ${
                  typography.fontFamily === item.id
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold'
                    : 'border-[var(--border-subtle)] hover:border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)]">
              Font Size
            </label>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {typography.fontSize}px
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] font-serif">A</span>
            <input
              type="range"
              min="14"
              max="24"
              step="1"
              value={typography.fontSize}
              onChange={(e) => updateTypography({ fontSize: Number(e.target.value) })}
              className="w-full accent-[var(--accent-gold)] cursor-pointer h-1.5 rounded-lg bg-[var(--bg-secondary)]"
            />
            <span className="text-base font-serif font-bold text-[var(--text-primary)]">A</span>
          </div>
        </div>

        {/* Line Height Slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)]">
              Line Spacing
            </label>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {typography.lineHeight.toFixed(2)}x
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AlignLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="range"
              min="1.4"
              max="2.2"
              step="0.05"
              value={typography.lineHeight}
              onChange={(e) => updateTypography({ lineHeight: Number(e.target.value) })}
              className="w-full accent-[var(--accent-gold)] cursor-pointer h-1.5 rounded-lg bg-[var(--bg-secondary)]"
            />
            <AlignLeft className="w-4.5 h-4.5 text-[var(--text-primary)]" />
          </div>
        </div>

        {/* Margin Width (Reading Pane Width) */}
        <div>
          <label className="text-xs uppercase font-medium tracking-wider text-[var(--text-secondary)] mb-2 block">
            Column Width
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'narrow', label: 'Compact', icon: Minimize2 },
                { id: 'normal', label: 'Golden (65ch)', icon: AlignLeft },
                { id: 'wide', label: 'Expansive', icon: Maximize2 },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => updateTypography({ maxWidth: item.id as MaxWidthMode })}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs border transition-all ${
                    typography.maxWidth === item.id
                      ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-medium'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear All Highlights Option */}
        {highlights.length > 0 && (
          <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">
              {highlights.length} highlight{highlights.length > 1 ? 's' : ''} active
            </span>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to clear all ${highlights.length} highlighted sections across all treatises?`
                  )
                ) {
                  clearAllHighlights();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Highlights</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
