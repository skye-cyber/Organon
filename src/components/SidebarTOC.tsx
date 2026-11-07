import React, { useState } from 'react';
import { useReaderStore } from '../store/readerStore';
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Search,
  X,
  Scroll,
  Compass,
} from 'lucide-react';

export const SidebarTOC: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({
    categories: true,
    'on-interpretation': true,
    'prior-analytics': true,
    'posterior-analytics': true,
    topics: true,
    'sophistical-refutations': true,
  });

  const bookData = useReaderStore((state) => state.bookData);
  const currentBookId = useReaderStore((state) => state.currentBookId);
  const currentChapterId = useReaderStore((state) => state.currentChapterId);
  const isTocOpen = useReaderStore((state) => state.isTocOpen);
  const setTocOpen = useReaderStore((state) => state.setTocOpen);
  const isZenMode = useReaderStore((state) => state.isZenMode);

  if (isZenMode || !isTocOpen) return null;

  const toggleBookExpand = (bookId: string) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const scrollToChapter = (chapterId: string) => {
    const el = document.getElementById(`ch-${chapterId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // On mobile devices, close TOC drawer after selecting a chapter
    if (window.innerWidth < 768) {
      setTocOpen(false);
    }
  };

  const books = bookData?.books || [];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={() => setTocOpen(false)}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs block md:hidden animate-in fade-in duration-150"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-50 md:z-20 w-72 sm:w-80 h-full flex-shrink-0 bg-[var(--bg-popover)] md:bg-[var(--bg-secondary)]/50 border-r border-[var(--border-subtle)] flex flex-col transition-all select-none shadow-2xl md:shadow-none animate-in slide-in-from-left-4 duration-150">
        {/* TOC Header */}
        <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--accent-gold)]" />
            <h2 className="font-title-classical font-semibold text-xs tracking-wider uppercase text-[var(--text-primary)]">
              Table of Contents
            </h2>
          </div>
          <button
            onClick={() => setTocOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter search box */}
        <div className="p-3 border-b border-[var(--border-subtle)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Filter treatises & chapters..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)] transition-colors"
            />
          </div>
        </div>

        {/* Treatises Accordion List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {books.map((book) => {
            const isExpanded = !!expandedBooks[book.id];
            const isCurrentBook = currentBookId === book.id;

            // Check if matches filter
            const matchingParts = book.parts
              .map((part) => ({
                ...part,
                chapters: part.chapters.filter((ch) =>
                  !filterQuery.trim()
                    ? true
                    : ch.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
                      book.title.toLowerCase().includes(filterQuery.toLowerCase())
                ),
              }))
              .filter((p) => p.chapters.length > 0);

            if (filterQuery.trim() && matchingParts.length === 0) {
              return null;
            }

            return (
              <div
                key={book.id}
                className="rounded-lg overflow-hidden border border-transparent transition-colors"
              >
                {/* Book Header Item */}
                <button
                  onClick={() => toggleBookExpand(book.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs font-semibold transition-all ${
                    isCurrentBook
                      ? 'text-[var(--accent-gold)] bg-[var(--accent-gold)]/10 font-bold'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-[var(--accent-gold)]" />
                    <span className="font-title-classical tracking-wide truncate">
                      {book.order}. {book.title}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                </button>

                {/* Parts and Chapters */}
                {isExpanded && (
                  <div className="pl-4 pr-1 py-1 space-y-2 border-l border-[var(--border-subtle)] ml-3.5 my-1">
                    {matchingParts.map((part) => (
                      <div key={part.id} className="space-y-0.5">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] px-2 py-0.5">
                          {part.title}
                        </div>

                        <div className="space-y-0.5 pl-1">
                          {part.chapters.map((chapter) => {
                            const isActiveChapter = currentChapterId === chapter.id;

                            return (
                              <button
                                key={chapter.id}
                                onClick={() => scrollToChapter(chapter.id)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all flex items-start gap-1.5 group ${
                                  isActiveChapter
                                    ? 'bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] font-semibold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                              >
                                <Scroll className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                                  isActiveChapter ? 'text-[var(--accent-gold)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                                }`} />
                                <span className="line-clamp-2 leading-relaxed">
                                  {chapter.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Organon Footer Info */}
        <div className="p-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center justify-between safe-area-bottom">
          <span>Aristotle (384–322 BC)</span>
          <span className="italic">Owen trans.</span>
        </div>
      </aside>
    </>
  );
};
