export interface OrganonParagraph {
  id: string;
  order: number;
  bekker?: string;
  text: string;
  summary?: string;
  embedding?: number[];
}

export interface OrganonChapter {
  id: string;
  title: string;
  order: number;
  paragraphs: OrganonParagraph[];
}

export interface OrganonPart {
  id: string;
  title: string;
  order: number;
  chapters: OrganonChapter[];
}

export interface OrganonBook {
  id: string;
  title: string;
  greek_title?: string;
  order: number;
  description?: string;
  parts: OrganonPart[];
}

export interface OrganonData {
  id: string;
  title: string;
  author: string;
  translator: string;
  language: string;
  description?: string;
  books: OrganonBook[];
}

export type HighlightColor = 'yellow' | 'blue' | 'red' | 'green';

export interface HighlightItem {
  id: string;
  paragraph_id: string;
  book_id?: string;
  chapter_title?: string;
  start_offset: number;
  end_offset: number;
  color: HighlightColor;
  selected_text: string;
  created_at?: string;
}

export interface NoteItem {
  id: string;
  paragraph_id: string;
  highlight_id?: string;
  book_id?: string;
  chapter_title?: string;
  note_text: string;
  created_at?: string;
  updated_at?: string;
}

export interface FavoriteItem {
  id: string;
  item_type: 'paragraph' | 'note';
  target_id: string;
  title?: string;
  preview_text?: string;
  created_at?: string;
}

export interface ReadingProgress {
  last_paragraph_id: string;
  last_book_id: string;
  last_chapter_id: string;
  scroll_percentage: number;
  updated_at?: string;
}

export interface DailyReadingStats {
  date: string;
  words_read: number;
  paragraphs_read: number;
  minutes_spent: number;
}

export type ThemeMode = 'light' | 'dark' | 'sepia';
export type FontFamily = 'serif' | 'sans' | 'mono';
export type MaxWidthMode = 'narrow' | 'normal' | 'wide';

export interface TypographySettings {
  fontSize: number; // in pixels (e.g. 18)
  lineHeight: number; // multiplier (e.g. 1.75)
  fontFamily: FontFamily;
  maxWidth: MaxWidthMode; // narrow: 50ch, normal: 65ch, wide: 80ch
}

export interface TextSelectionState {
  text: string;
  paragraphId: string;
  bookId: string;
  chapterTitle: string;
  startOffset: number;
  endOffset: number;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface DictionaryDefinition {
  partOfSpeech: string;
  definition: string;
  example?: string;
}

export interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: DictionaryDefinition[];
  origin?: string;
  wikipediaExcerpt?: string;
  wikipediaUrl?: string;
}

export interface SearchResultItem {
  paragraphId: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  bekker?: string;
  snippet: string;
  fullText?: string;
  matchCount?: number;
  similarityScore?: number;
  isSemantic?: boolean;
}
