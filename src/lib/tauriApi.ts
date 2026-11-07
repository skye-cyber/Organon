import {
  OrganonData,
  HighlightItem,
  NoteItem,
  FavoriteItem,
  ReadingProgress,
  DailyReadingStats,
} from '../types';

// Detect if running inside Tauri webview
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// Safe dynamic invoke wrapper
async function invokeTauri<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`[TauriApi] Error invoking ${cmd}:`, err);
      throw err;
    }
  }
  throw new Error('Not running inside Tauri context');
}

// 1. Fetch Organon Book Data
export async function fetchOrganonData(): Promise<OrganonData> {
  if (isTauri()) {
    try {
      const data = await invokeTauri<OrganonData>('get_organon_data');
      return data;
    } catch (e) {
      console.warn('Failed to load via Tauri invoke, attempting fallback...', e);
    }
  }

  // Fallback for browser mode / Vite dev server
  try {
    const res = await fetch('/data/organon_english.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error fetching /data/organon_english.json:', err);
  }

  // Secondary fallback to data/organon.json
  const res2 = await fetch('/data/organon.json');
  return await res2.json();
}

// 2. Highlights Persistence
export async function getStoredHighlights(): Promise<HighlightItem[]> {
  if (isTauri()) {
    try {
      return await invokeTauri<HighlightItem[]>('get_highlights');
    } catch (e) {
      console.warn('Failed to fetch highlights from SQLite:', e);
    }
  }
  const raw = localStorage.getItem('organon_highlights');
  return raw ? JSON.parse(raw) : [];
}

export async function saveStoredHighlight(highlight: HighlightItem): Promise<HighlightItem> {
  if (isTauri()) {
    try {
      return await invokeTauri<HighlightItem>('save_highlight', { highlight });
    } catch (e) {
      console.warn('Failed to save highlight to SQLite:', e);
    }
  }
  const current = await getStoredHighlights();
  const filtered = current.filter((h) => h.id !== highlight.id);
  const updated = [highlight, ...filtered];
  localStorage.setItem('organon_highlights', JSON.stringify(updated));
  return highlight;
}

export async function deleteStoredHighlight(id: string): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invokeTauri<boolean>('delete_highlight', { id });
    } catch (e) {
      console.warn('Failed to delete highlight from SQLite:', e);
    }
  }
  const current = await getStoredHighlights();
  const updated = current.filter((h) => h.id !== id);
  localStorage.setItem('organon_highlights', JSON.stringify(updated));
  return true;
}

export async function clearAllStoredHighlights(): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invokeTauri<boolean>('clear_all_highlights');
    } catch (e) {
      console.warn('Failed to clear all highlights from SQLite:', e);
    }
  }
  localStorage.removeItem('organon_highlights');
  return true;
}

export async function clearParagraphStoredHighlights(paragraphId: string): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invokeTauri<boolean>('clear_paragraph_highlights', { paragraphId });
    } catch (e) {
      console.warn('Failed to clear paragraph highlights from SQLite:', e);
    }
  }
  const current = await getStoredHighlights();
  const updated = current.filter((h) => h.paragraph_id !== paragraphId);
  localStorage.setItem('organon_highlights', JSON.stringify(updated));
  return true;
}

// 3. Notes Persistence
export async function getStoredNotes(): Promise<NoteItem[]> {
  if (isTauri()) {
    try {
      return await invokeTauri<NoteItem[]>('get_notes');
    } catch (e) {
      console.warn('Failed to fetch notes from SQLite:', e);
    }
  }
  const raw = localStorage.getItem('organon_notes');
  return raw ? JSON.parse(raw) : [];
}

export async function saveStoredNote(note: NoteItem): Promise<NoteItem> {
  if (isTauri()) {
    try {
      return await invokeTauri<NoteItem>('save_note', { note });
    } catch (e) {
      console.warn('Failed to save note to SQLite:', e);
    }
  }
  const current = await getStoredNotes();
  const filtered = current.filter((n) => n.id !== note.id);
  const updated = [note, ...filtered];
  localStorage.setItem('organon_notes', JSON.stringify(updated));
  return note;
}

export async function deleteStoredNote(id: string): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invokeTauri<boolean>('delete_note', { id });
    } catch (e) {
      console.warn('Failed to delete note from SQLite:', e);
    }
  }
  const current = await getStoredNotes();
  const updated = current.filter((n) => n.id !== id);
  localStorage.setItem('organon_notes', JSON.stringify(updated));
  return true;
}

// 4. Favorites Persistence
export async function getStoredFavorites(): Promise<FavoriteItem[]> {
  if (isTauri()) {
    try {
      return await invokeTauri<FavoriteItem[]>('get_favorites');
    } catch (e) {
      console.warn('Failed to fetch favorites from SQLite:', e);
    }
  }
  const raw = localStorage.getItem('organon_favorites');
  return raw ? JSON.parse(raw) : [];
}

export async function toggleStoredFavorite(favorite: FavoriteItem): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invokeTauri<boolean>('toggle_favorite', { favorite });
    } catch (e) {
      console.warn('Failed to toggle favorite in SQLite:', e);
    }
  }
  const current = await getStoredFavorites();
  const exists = current.some((f) => f.target_id === favorite.target_id);
  if (exists) {
    const updated = current.filter((f) => f.target_id !== favorite.target_id);
    localStorage.setItem('organon_favorites', JSON.stringify(updated));
    return false;
  } else {
    const updated = [favorite, ...current];
    localStorage.setItem('organon_favorites', JSON.stringify(updated));
    return true;
  }
}

// 5. Reading Progress Persistence
export async function getStoredReadingProgress(): Promise<ReadingProgress | null> {
  if (isTauri()) {
    try {
      return await invokeTauri<ReadingProgress | null>('get_reading_progress');
    } catch (e) {
      console.warn('Failed to fetch reading progress from SQLite:', e);
    }
  }
  const raw = localStorage.getItem('organon_reading_progress');
  return raw ? JSON.parse(raw) : null;
}

export async function saveStoredReadingProgress(progress: ReadingProgress): Promise<ReadingProgress> {
  if (isTauri()) {
    try {
      return await invokeTauri<ReadingProgress>('save_reading_progress', { progress });
    } catch (e) {
      console.warn('Failed to save reading progress to SQLite:', e);
    }
  }
  localStorage.setItem('organon_reading_progress', JSON.stringify(progress));
  return progress;
}

// 6. Reading Stats Persistence
export async function getStoredReadingStats(date?: string): Promise<DailyReadingStats> {
  const dateKey = date || new Date().toISOString().split('T')[0];
  if (isTauri()) {
    try {
      return await invokeTauri<DailyReadingStats>('get_reading_stats', { date: dateKey });
    } catch (e) {
      console.warn('Failed to fetch reading stats from SQLite:', e);
    }
  }
  const raw = localStorage.getItem(`organon_stats_${dateKey}`);
  return raw
    ? JSON.parse(raw)
    : {
        date: dateKey,
        words_read: 0,
        paragraphs_read: 0,
        minutes_spent: 0,
      };
}

export async function recordReadingStats(
  words: number,
  paragraphs: number,
  minutes: number
): Promise<DailyReadingStats> {
  const dateKey = new Date().toISOString().split('T')[0];
  if (isTauri()) {
    try {
      return await invokeTauri<DailyReadingStats>('record_reading_activity', {
        words,
        paragraphs,
        minutes,
        date: dateKey,
      });
    } catch (e) {
      console.warn('Failed to update stats in SQLite:', e);
    }
  }
  const current = await getStoredReadingStats(dateKey);
  const updated: DailyReadingStats = {
    date: dateKey,
    words_read: current.words_read + words,
    paragraphs_read: current.paragraphs_read + paragraphs,
    minutes_spent: current.minutes_spent + minutes,
  };
  localStorage.setItem(`organon_stats_${dateKey}`, JSON.stringify(updated));
  return updated;
}
