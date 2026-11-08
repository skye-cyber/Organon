import React, { useState } from 'react';
import { useReaderStore } from '../store/readerStore';
import {
  Menu,
  Search,
  Type,
//   Maximize,
  BookOpen,
  Bookmark,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { TypographyPopover } from './TypographyPopover';

export const Header: React.FC = () => {
  const [isTypoOpen, setIsTypoOpen] = useState(false);

  const bookData = useReaderStore((state) => state.bookData);
  const currentBookId = useReaderStore((state) => state.currentBookId);
  const currentChapterId = useReaderStore((state) => state.currentChapterId);
  const isZenMode = useReaderStore((state) => state.isZenMode);
  const isTocOpen = useReaderStore((state) => state.isTocOpen);
  const isNotesOpen = useReaderStore((state) => state.isNotesOpen);
  const toggleToc = useReaderStore((state) => state.toggleToc);
  const toggleNotes = useReaderStore((state) => state.toggleNotes);
  const toggleSearch = useReaderStore((state) => state.toggleSearch);
  const toggleZenMode = useReaderStore((state) => state.toggleZenMode);
  const setKeyboardModalOpen = useReaderStore((state) => state.setKeyboardModalOpen);

  // If in zen focus mode, hide header completely for true distraction-free reading
  if (isZenMode) return null;

  // Resolve current Book & Chapter titles
  const currentBook = bookData?.books.find((b) => b.id === currentBookId);
  let currentChapterTitle = '';
  if (currentBook) {
    for (const part of currentBook.parts) {
      const ch = part.chapters.find((c) => c.id === currentChapterId);
      if (ch) {
        currentChapterTitle = ch.title;
        break;
      }
    }
  }

  return (
    <header className="absolute top-0 w-full z-40 h-14 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 flex items-center justify-between transition-colors ">
      {/* Left Navigation controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleToc}
          title="Toggle Table of Contents (Ctrl+\)"
          className={`p-2 rounded-lg transition-all ${
            isTocOpen
              ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--accent-gold)]" />
          <span className="font-title-classical font-semibold text-sm tracking-wider uppercase text-[var(--text-primary)]">
            {currentBook ? currentBook.title : "Aristotle's Organon"}
          </span>
          {currentBook?.greek_title && (
            <span className="text-xs text-[var(--text-muted)] font-serif italic hidden md:inline">
              ({currentBook.greek_title})
            </span>
          )}
        </div>
      </div>

      {/* Center Breadcrumb */}
      <div className="flex-1 max-w-md mx-4 text-center truncate w-fit max-w-[50%] sm:max-w-fit truncate">
        {currentChapterTitle ? (
          <span className="text-xs md:text-sm text-[var(--text-secondary)] font-medium truncate inline-block w-fit max-w-32 sm:max-w-fit truncate">
            {currentChapterTitle}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)] italic">
            The Complete Logical Treatises
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1.5">
        <button
          onClick={() => toggleSearch()}
          title="Search Full-Text & Semantics (Ctrl+F)"
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors relative flex items-center gap-1 text-xs"
        >
          <Search className="w-4 h-4" />
          <span className="hidden lg:inline text-[11px] bg-[var(--bg-secondary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
            ⌘F
          </span>
        </button>

        <button
          onClick={() => setIsTypoOpen(!isTypoOpen)}
          title="Typography & Appearance"
          className={`p-2 rounded-lg transition-colors ${
            isTypoOpen
              ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          onClick={toggleZenMode}
          title="Zen Focus Mode (Z)"
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs hidden xl:inline font-medium text-[var(--text-secondary)]">Zen</span>
        </button>

        <button
          onClick={toggleNotes}
          title="Notes & Highlights Sidebar (Ctrl+M)"
          className={`p-2 rounded-lg transition-colors ${
            isNotesOpen
              ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
        </button>

        <button
          onClick={() => setKeyboardModalOpen(true)}
          title="Keyboard Shortcuts (?)"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hidden sm:block"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Typography Popover modal */}
      <TypographyPopover isOpen={isTypoOpen} onClose={() => setIsTypoOpen(false)} />
    </header>
  );
};
