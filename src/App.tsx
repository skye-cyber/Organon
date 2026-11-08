import React, { useEffect, useRef } from 'react';
import { useReaderStore } from './store/readerStore';
import { Header } from './components/Header';
import { SidebarTOC } from './components/SidebarTOC';
import { Reader } from './components/Reader';
import { NotesPanel } from './components/NotesPanel';
import { SelectionPopover } from './components/SelectionPopover';
import { SearchModal } from './components/SearchModal';
import { DictionaryModal } from './components/DictionaryModal';
import { ZenModeControls } from './components/ZenModeControls';
import { ReadingProgress } from './components/ReadingProgress';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import {
  BookOpen,
  Search,
  Sparkles,
  Bookmark,
} from 'lucide-react';

declare global {
  interface Window {
    __toggleZenMode?: () => void;
  }
}

export const App: React.FC = () => {
  const initApp = useReaderStore((state) => state.initApp);
  const toggleSearch = useReaderStore((state) => state.toggleSearch);
  const toggleToc = useReaderStore((state) => state.toggleToc);
  const toggleNotes = useReaderStore((state) => state.toggleNotes);
  const toggleZenMode = useReaderStore((state) => state.toggleZenMode);
  const isZenMode = useReaderStore((state) => state.isZenMode);
  const isTocOpen = useReaderStore((state) => state.isTocOpen);
  const isNotesOpen = useReaderStore((state) => state.isNotesOpen);
  const isSearchOpen = useReaderStore((state) => state.isSearchOpen);
  const setSearchOpen = useReaderStore((state) => state.setSearchOpen);
  const dictionaryModal = useReaderStore((state) => state.dictionaryModal);
  const closeDictionary = useReaderStore((state) => state.closeDictionary);
  const setSelection = useReaderStore((state) => state.setSelection);
  const setKeyboardModalOpen = useReaderStore((state) => state.setKeyboardModalOpen);
  const setTocOpen = useReaderStore((state) => state.setTocOpen);
  const setNotesOpen = useReaderStore((state) => state.setNotesOpen);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Expose toggleZenMode to window for tray and global shortcuts
  useEffect(() => {
    window.__toggleZenMode = () => {
      toggleZenMode();
    };
    return () => {
      delete window.__toggleZenMode;
    };
  }, [toggleZenMode]);

  // Mobile Touch Swipe Gesture Detection:
  // - Swipe right (L->R): closes Notes modal if open, otherwise opens Content (TOC) panel
  // - Swipe left (R->L): closes Content (TOC) modal if open, otherwise opens Notes panel
  // - Mutually exclusive: only one panel can be open at a time on mobile.
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const duration = Date.now() - touchStartTime;

        // Verify gesture is primarily horizontal and meets minimum swipe threshold
        const isHorizontal =
          Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;
        const hasTextSelection =
          typeof window !== 'undefined' &&
          window.getSelection &&
          window.getSelection()!.toString().trim().length > 0;

        if (isHorizontal && duration < 650 && !hasTextSelection) {
          const { isTocOpen: tocOpen, isNotesOpen: notesOpen } = useReaderStore.getState();

          if (deltaX > 0) {
            // Swiping from Left to Right
            if (notesOpen) {
              // Prioritize closing the right (Notes) modal if open
              setNotesOpen(false);
            } else {
              // Otherwise open the left (TOC) content panel
              setNotesOpen(false);
              setTocOpen(true);
            }
          } else {
            // Swiping from Right to Left
            if (tocOpen) {
              // Prioritize closing the left (TOC) modal if open
              setTocOpen(false);
            } else {
              // Otherwise open the right (Notes) panel
              setTocOpen(false);
              setNotesOpen(true);
            }
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [setTocOpen, setNotesOpen]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        (e.target as HTMLElement)?.tagName
      );

      // Escape key to dismiss modals & selections
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setSearchOpen(false);
          return;
        }
        if (dictionaryModal.isOpen) {
          closeDictionary();
          return;
        }
        setSelection(null);
        setKeyboardModalOpen(false);
        return;
      }

      // Ignore standard letter shortcuts if typing in an input
      if (isInput) return;

      // Cmd/Ctrl + F for Search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleSearch();
        return;
      }

      // Cmd/Ctrl + \ for TOC
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleToc();
        return;
      }

      // Cmd/Ctrl + M for Marginalia / Notes Panel
      if ((e.metaKey || e.ctrlKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        toggleNotes();
        return;
      }

      // '?' for Shortcuts Cheat Sheet
      if (e.key === '?') {
        e.preventDefault();
        setKeyboardModalOpen(true);
        return;
      }

      // J / K for next / previous paragraph navigation
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const active = document.querySelector('.zen-active') || document.querySelector('[data-paragraph-id]');
        if (active) {
          const next = active.parentElement?.nextElementSibling?.querySelector('[data-paragraph-id]') ||
            active.nextElementSibling;
          if (next) {
            next.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const active = document.querySelector('.zen-active') || document.querySelector('[data-paragraph-id]');
        if (active) {
          const prev = active.parentElement?.previousElementSibling?.querySelector('[data-paragraph-id]') ||
            active.previousElementSibling;
          if (prev) {
            prev.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleSearch,
    toggleToc,
    toggleNotes,
    toggleZenMode,
    isSearchOpen,
    setSearchOpen,
    dictionaryModal.isOpen,
    closeDictionary,
    setSelection,
    setKeyboardModalOpen,
  ]);

  return (
    <div className="relative h-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors selection:bg-[var(--selection-bg)]">
      {/* Top Subtle Reading Progress Bar */}
      <ReadingProgress />

      {/* Top Navigation Header (Fixed, Does Not Move on Scroll) */}
      <Header />

      {/* Main Reading Workspace with Sticky Left/Right Sidebars and Dedicated Content Scroll */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left: Collapsible Table of Contents (Fixed / Sticky) */}
        <SidebarTOC />

        {/* Center: Distraction-Free Reading Pane (Delegated Scroll) */}
        <Reader />

        {/* Right: Collapsible Notes, Highlights & Goals Panel (Fixed / Sticky) */}
        <NotesPanel />
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      {!isZenMode && (
        <nav className="absolute bottom-0 w-full md:hidden h-14 flex-shrink-0 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] flex items-center justify-around px-2 z-40 shadow-lg select-none">
          <button
            onClick={toggleToc}
            className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg text-[10px] transition-colors ${
              isTocOpen ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-secondary)]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Contents</span>
          </button>

          <button
            onClick={toggleSearch}
            className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>

          <button
            onClick={toggleZenMode}
            className="flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg text-[10px] text-amber-500 hover:text-amber-600 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Focus</span>
          </button>

          <button
            onClick={toggleNotes}
            className={`flex flex-col items-center justify-center gap-0.5 p-1 rounded-lg text-[10px] transition-colors ${
              isNotesOpen ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-secondary)]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Notes</span>
          </button>
        </nav>
      )}

      {/* Floating Popovers & Modals */}
      <SelectionPopover />
      <SearchModal />
      <DictionaryModal />
      <ZenModeControls />
      <KeyboardShortcutsModal />
    </div>
  );
};

export default App;
