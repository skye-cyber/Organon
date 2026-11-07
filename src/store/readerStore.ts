import { create } from 'zustand';
import {
  OrganonData,
  HighlightItem,
  NoteItem,
  FavoriteItem,
  ReadingProgress,
  DailyReadingStats,
  ThemeMode,
  TypographySettings,
  TextSelectionState,
  DictionaryResult,
  HighlightColor,
} from '../types';
import * as tauriApi from '../lib/tauriApi';
import { lookupDefinition } from '../lib/dictionaryApi';

interface ReaderState {
  // Data
  bookData: OrganonData | null;
  isLoading: boolean;
  error: string | null;

  // Active Reading Location
  currentBookId: string;
  currentChapterId: string;
  currentParagraphId: string;
  readingProgress: number; // 0 - 100

  // UI Settings & Flags
  theme: ThemeMode;
  typography: TypographySettings;
  isZenMode: boolean;
  isTocOpen: boolean;
  isNotesOpen: boolean;
  isSearchOpen: boolean;
  activeNotesTab: 'feed' | 'mymind' | 'favorites' | 'stats';
  isKeyboardModalOpen: boolean;

  // Popovers & Floating Modals
  selection: TextSelectionState | null;
  dictionaryModal: {
    isOpen: boolean;
    word: string;
    loading: boolean;
    result: DictionaryResult | null;
  };

  // Annotations
  highlights: HighlightItem[];
  notes: NoteItem[];
  favorites: FavoriteItem[];
  dailyStats: DailyReadingStats;

  // Actions
  initApp: () => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  updateTypography: (settings: Partial<TypographySettings>) => void;
  toggleZenMode: () => void;
  setZenMode: (enabled: boolean) => void;
  toggleToc: () => void;
  setTocOpen: (open: boolean) => void;
  toggleNotes: () => void;
  setNotesOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setActiveNotesTab: (tab: 'feed' | 'mymind' | 'favorites' | 'stats') => void;
  setKeyboardModalOpen: (open: boolean) => void;

  // Selection & Dictionary
  setSelection: (sel: TextSelectionState | null) => void;
  openDictionary: (word: string) => Promise<void>;
  closeDictionary: () => void;

  // Reading Navigation & Progress
  setLocation: (
    bookId: string,
    chapterId: string,
    paragraphId: string,
    percentage?: number
  ) => void;
  restoreLastRead: () => void;

  // Highlight CRUD
  createHighlight: (color: HighlightColor) => Promise<void>;
  deleteHighlight: (id: string) => Promise<void>;
  unhighlightSelection: () => Promise<void>;
  clearAllHighlights: () => Promise<void>;
  clearParagraphHighlights: (paragraphId: string) => Promise<void>;

  // Note CRUD
  createNote: (
    paragraphId: string,
    noteText: string,
    highlightId?: string,
    bookId?: string,
    chapterTitle?: string
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Favorites
  toggleFavorite: (
    targetId: string,
    type: 'paragraph' | 'note',
    title?: string,
    previewText?: string
  ) => Promise<void>;

  // Goals & Stats
  recordReading: (words: number, paragraphs: number) => Promise<void>;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
  bookData: null,
  isLoading: true,
  error: null,

  currentBookId: 'categories',
  currentChapterId: 'cat-ch-1',
  currentParagraphId: 'cat-p-1',
  readingProgress: 0,

  theme: 'dark',
  typography: {
    fontSize: 18,
    lineHeight: 1.75,
    fontFamily: 'serif',
    maxWidth: 'normal',
  },
  isZenMode: false,
  isTocOpen: typeof window !== 'undefined' && window.innerWidth >= 1024,
  isNotesOpen: false,
  isSearchOpen: false,
  activeNotesTab: 'feed',
  isKeyboardModalOpen: false,

  selection: null,
  dictionaryModal: {
    isOpen: false,
    word: '',
    loading: false,
    result: null,
  },

  highlights: [],
  notes: [],
  favorites: [],
  dailyStats: {
    date: new Date().toISOString().split('T')[0],
    words_read: 0,
    paragraphs_read: 0,
    minutes_spent: 0,
  },

  initApp: async () => {
    try {
      set({ isLoading: true, error: null });

      // 1. Load persisted theme from localStorage
      const savedTheme = (localStorage.getItem('organon_theme') as ThemeMode) || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);

      // 2. Load persisted typography
      const savedTypo = localStorage.getItem('organon_typography');
      const typography = savedTypo
        ? JSON.parse(savedTypo)
        : {
            fontSize: 18,
            lineHeight: 1.75,
            fontFamily: 'serif',
            maxWidth: 'normal',
          };

      // 3. Load Book Data via Tauri or fallback
      const data = await tauriApi.fetchOrganonData();

      // 4. Load Highlights, Notes, Favorites, Stats, and Progress
      const [highlights, notes, favorites, stats, progress] = await Promise.all([
        tauriApi.getStoredHighlights(),
        tauriApi.getStoredNotes(),
        tauriApi.getStoredFavorites(),
        tauriApi.getStoredReadingStats(),
        tauriApi.getStoredReadingProgress(),
      ]);

      const initialBookId = progress?.last_book_id || data?.books[0]?.id || 'categories';
      const initialChapterId =
        progress?.last_chapter_id || data?.books[0]?.parts[0]?.chapters[0]?.id || 'cat-ch-1';
      const initialParagraphId =
        progress?.last_paragraph_id ||
        data?.books[0]?.parts[0]?.chapters[0]?.paragraphs[0]?.id ||
        'cat-p-1';
      const initialProgress = progress?.scroll_percentage || 0;

      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

      set({
        bookData: data,
        theme: savedTheme,
        typography,
        highlights,
        notes,
        favorites,
        dailyStats: stats,
        currentBookId: initialBookId,
        currentChapterId: initialChapterId,
        currentParagraphId: initialParagraphId,
        readingProgress: initialProgress,
        isTocOpen: isDesktop,
        isNotesOpen: false,
        isLoading: false,
      });

      // Restore scroll to paragraph ID after render
      setTimeout(() => {
        get().restoreLastRead();
      }, 350);
    } catch (err) {
      console.error('[ReaderStore] Init failed:', err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  setTheme: (theme: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('organon_theme', theme);
    set({ theme });
  },

  updateTypography: (settings: Partial<TypographySettings>) => {
    const next = { ...get().typography, ...settings };
    localStorage.setItem('organon_typography', JSON.stringify(next));
    set({ typography: next });
  },

  toggleZenMode: () => {
    const next = !get().isZenMode;
    set({
      isZenMode: next,
      ...(next ? { isTocOpen: false, isNotesOpen: false } : {}),
    });
  },

  setZenMode: (enabled: boolean) => {
    set({
      isZenMode: enabled,
      ...(enabled ? { isTocOpen: false, isNotesOpen: false } : {}),
    });
  },

  // Mutually exclusive toggle for TOC
  toggleToc: () => {
    const next = !get().isTocOpen;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    set({
      isTocOpen: next,
      ...(next && isMobile ? { isNotesOpen: false } : {}),
    });
  },

  setTocOpen: (open: boolean) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    set({
      isTocOpen: open,
      ...(open && isMobile ? { isNotesOpen: false } : {}),
    });
  },

  // Mutually exclusive toggle for Notes
  toggleNotes: () => {
    const next = !get().isNotesOpen;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    set({
      isNotesOpen: next,
      ...(next && isMobile ? { isTocOpen: false } : {}),
    });
  },

  setNotesOpen: (open: boolean) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    set({
      isNotesOpen: open,
      ...(open && isMobile ? { isTocOpen: false } : {}),
    });
  },

  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

  setActiveNotesTab: (tab) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    set({
      activeNotesTab: tab,
      isNotesOpen: true,
      ...(isMobile ? { isTocOpen: false } : {}),
    });
  },

  setKeyboardModalOpen: (open) => set({ isKeyboardModalOpen: open }),

  setSelection: (selection) => set({ selection }),

  openDictionary: async (word: string) => {
    set({
      dictionaryModal: {
        isOpen: true,
        word,
        loading: true,
        result: null,
      },
    });

    try {
      const result = await lookupDefinition(word);
      set((state) => ({
        dictionaryModal: {
          ...state.dictionaryModal,
          loading: false,
          result,
        },
      }));
    } catch {
      set((state) => ({
        dictionaryModal: {
          ...state.dictionaryModal,
          loading: false,
        },
      }));
    }
  },

  closeDictionary: () =>
    set({
      dictionaryModal: {
        isOpen: false,
        word: '',
        loading: false,
        result: null,
      },
    }),

  setLocation: (bookId, chapterId, paragraphId, percentage = 0) => {
    set({
      currentBookId: bookId,
      currentChapterId: chapterId,
      currentParagraphId: paragraphId,
      readingProgress: percentage,
    });

    // Save reading progress to SQLite
    tauriApi.saveStoredReadingProgress({
      last_book_id: bookId,
      last_chapter_id: chapterId,
      last_paragraph_id: paragraphId,
      scroll_percentage: percentage,
    });
  },

  restoreLastRead: () => {
    const { currentParagraphId } = get();
    if (!currentParagraphId) return;

    const el = document.getElementById(`p-${currentParagraphId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('zen-active');
      setTimeout(() => el.classList.remove('zen-active'), 1500);
    }
  },

  createHighlight: async (color: HighlightColor) => {
    const sel = get().selection;
    if (!sel || !sel.text.trim()) return;

    const start = sel.startOffset;
    const end = sel.endOffset;
    const existing = get().highlights;

    // Remove any previous highlights on the same paragraph that are completely inside the new range
    const toRemove = existing.filter(
      (h) => h.paragraph_id === sel.paragraphId && h.start_offset >= start && h.end_offset <= end
    );
    for (const r of toRemove) {
      await tauriApi.deleteStoredHighlight(r.id);
    }

    const id = `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const highlight: HighlightItem = {
      id,
      paragraph_id: sel.paragraphId,
      book_id: sel.bookId,
      chapter_title: sel.chapterTitle,
      start_offset: sel.startOffset,
      end_offset: sel.endOffset,
      color,
      selected_text: sel.text,
      created_at: new Date().toISOString(),
    };

    await tauriApi.saveStoredHighlight(highlight);
    const remaining = existing.filter((h) => !toRemove.some((r) => r.id === h.id));
    set({ highlights: [highlight, ...remaining], selection: null });

    // Clear window selection
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  },

  deleteHighlight: async (id: string) => {
    await tauriApi.deleteStoredHighlight(id);
    const updated = get().highlights.filter((h) => h.id !== id);
    set({ highlights: updated });
  },

  unhighlightSelection: async () => {
    const sel = get().selection;
    if (!sel) return;

    const { paragraphId, startOffset, endOffset } = sel;
    const existing = get().highlights;

    // Find all highlights on the same paragraph that have any overlap (full or partial) with the selection
    const overlapping = existing.filter(
      (h) => h.paragraph_id === paragraphId && h.start_offset < endOffset && h.end_offset > startOffset
    );

    for (const h of overlapping) {
      await tauriApi.deleteStoredHighlight(h.id);
    }

    const remaining = existing.filter((h) => !overlapping.some((o) => o.id === h.id));
    set({ highlights: remaining, selection: null });

    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
  },

  clearAllHighlights: async () => {
    await tauriApi.clearAllStoredHighlights();
    set({ highlights: [], selection: null });
  },

  clearParagraphHighlights: async (paragraphId: string) => {
    await tauriApi.clearParagraphStoredHighlights(paragraphId);
    const remaining = get().highlights.filter((h) => h.paragraph_id !== paragraphId);
    set({ highlights: remaining, selection: null });
  },

  createNote: async (paragraphId, noteText, highlightId, bookId, chapterTitle) => {
    if (!noteText.trim()) return;

    const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const note: NoteItem = {
      id,
      paragraph_id: paragraphId,
      highlight_id: highlightId,
      book_id: bookId || get().currentBookId,
      chapter_title: chapterTitle || '',
      note_text: noteText,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await tauriApi.saveStoredNote(note);
    const updated = [note, ...get().notes];
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    set({
      notes: updated,
      selection: null,
      isNotesOpen: true,
      ...(isMobile ? { isTocOpen: false } : {}),
    });
  },

  deleteNote: async (id: string) => {
    await tauriApi.deleteStoredNote(id);
    const updated = get().notes.filter((n) => n.id !== id);
    set({ notes: updated });
  },

  toggleFavorite: async (targetId, type, title, previewText) => {
    const id = `fav_${targetId}`;
    const fav: FavoriteItem = {
      id,
      item_type: type,
      target_id: targetId,
      title,
      preview_text: previewText,
      created_at: new Date().toISOString(),
    };

    await tauriApi.toggleStoredFavorite(fav);
    const current = get().favorites;
    const exists = current.some((f) => f.target_id === targetId);
    const updated = exists
      ? current.filter((f) => f.target_id !== targetId)
      : [fav, ...current];

    set({ favorites: updated });
  },

  recordReading: async (words: number, paragraphs: number) => {
    const updated = await tauriApi.recordReadingStats(words, paragraphs, 1);
    set({ dailyStats: updated });
  },
}));
