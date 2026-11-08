import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import { OrganonParagraph, HighlightItem } from '../types';
import { copyToClipboard } from '../lib/clipboard';
import {
  Star,
  Copy,
  BookOpen,
  Check,
  Eraser,
} from 'lucide-react';

export const Reader: React.FC = () => {
  const bookData = useReaderStore((state) => state.bookData);
  const typography = useReaderStore((state) => state.typography);
  const isZenMode = useReaderStore((state) => state.isZenMode);
  const currentParagraphId = useReaderStore((state) => state.currentParagraphId);
  const highlights = useReaderStore((state) => state.highlights);
  const favorites = useReaderStore((state) => state.favorites);
  const setLocation = useReaderStore((state) => state.setLocation);
  const setSelection = useReaderStore((state) => state.setSelection);
  const toggleFavorite = useReaderStore((state) => state.toggleFavorite);
  const recordReading = useReaderStore((state) => state.recordReading);
  const clearParagraphHighlights = useReaderStore((state) => state.clearParagraphHighlights);

  const containerRef = useRef<HTMLDivElement>(null);
  const visitedParagraphs = useRef<Set<string>>(new Set());
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Map highlights by paragraph ID for fast O(1) lookup
  const highlightsByParagraph = useMemo(() => {
    const map = new Map<string, HighlightItem[]>();
    for (const h of highlights) {
      const list = map.get(h.paragraph_id) || [];
      list.push(h);
      map.set(h.paragraph_id, list);
    }
    return map;
  }, [highlights]);

  // Map favorites by target ID for fast lookup
  const favoritesMap = useMemo(() => {
    const map = new Set<string>();
    for (const f of favorites) {
      map.add(f.target_id);
    }
    return map;
  }, [favorites]);

  // Text selection handler with robust mobile touch and desktop cursor support
  const updateSelectionFromDOM = useCallback(() => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        return;
      }

      const selectedText = sel.toString().trim();
      if (selectedText.length < 1) return;

      const range = sel.getRangeAt(0);
      if (!range) return;

      // Locate paragraph container from range startContainer or commonAncestor
      let parElement: HTMLElement | null = null;
      let node: Node | null = range.startContainer;
      while (node && node !== document.body) {
        if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).hasAttribute('data-paragraph-id')) {
          parElement = node as HTMLElement;
          break;
        }
        node = node.parentNode;
      }

      if (!parElement && range.commonAncestorContainer) {
        const anc = range.commonAncestorContainer;
        const ancEl = anc.nodeType === Node.ELEMENT_NODE ? (anc as HTMLElement) : anc.parentElement;
        parElement = ancEl?.closest('[data-paragraph-id]') as HTMLElement | null;
      }

      if (!parElement) return;

      const paragraphId = parElement.getAttribute('data-paragraph-id') || '';
      const bookId = parElement.getAttribute('data-book-id') || '';
      const chapterTitle = parElement.getAttribute('data-chapter-title') || '';
      const fullText = parElement.getAttribute('data-full-text') || '';

      // Paragraph text container is the <p> element inside parElement
      const pElement = parElement.querySelector('p') || parElement;

      // Compute exact character offset within paragraph using DOM Range
      let startOffset = 0;
      let endOffset = selectedText.length;
      try {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(pElement);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        startOffset = preCaretRange.toString().length;
        endOffset = startOffset + selectedText.length;
      } catch {
        const idx = fullText.indexOf(selectedText);
        startOffset = idx !== -1 ? idx : 0;
        endOffset = startOffset + selectedText.length;
      }

      // Calculate bounding rect with client rects fallback
      let rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        const clientRects = range.getClientRects();
        if (clientRects.length > 0) {
          rect = clientRects[0];
        }
      }

      const pRect = pElement.getBoundingClientRect();
      const validRect =
        rect.width > 0 || rect.height > 0
          ? {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }
          : {
              top: pRect.top + 8,
              left: pRect.left + 8,
              width: Math.min(200, pRect.width),
              height: 24,
            };

      setSelection({
        text: selectedText,
        paragraphId,
        bookId,
        chapterTitle,
        startOffset,
        endOffset,
        rect: validRect,
      });
    } catch (e) {
      console.warn('[Reader] Suppressed selection update error:', e);
    }
  }, [setSelection]);

  // Listen to document selectionchange for mobile text selection handles
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handleSelectionChange = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
          return;
        }
        updateSelectionFromDOM();
      }, 160);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (timer) clearTimeout(timer);
    };
  }, [updateSelectionFromDOM]);

  // Delegate scroll handling directly to content container for smooth progress calculation
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const pct = maxScroll > 0 ? (el.scrollTop / maxScroll) * 100 : 0;
    const { currentBookId, currentChapterId, currentParagraphId } = useReaderStore.getState();
    setLocation(currentBookId, currentChapterId, currentParagraphId, Math.round(pct));
  }, [setLocation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Scoped Intersection Observer (root = containerRef.current)
  useEffect(() => {
    const container = containerRef.current;
    if (!bookData || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const parId = el.getAttribute('data-paragraph-id');
            const chId = el.getAttribute('data-chapter-id');
            const bkId = el.getAttribute('data-book-id');

            if (parId && chId && bkId) {
              const maxScroll = container.scrollHeight - container.clientHeight;
              const pct = maxScroll > 0 ? (container.scrollTop / maxScroll) * 100 : 0;

              setLocation(bkId, chId, parId, Math.round(pct));

              // Record words read if new paragraph entered viewport
              if (!visitedParagraphs.current.has(parId)) {
                visitedParagraphs.current.add(parId);
                const wordCount = (el.textContent || '').trim().split(/\s+/).length;
                recordReading(wordCount, 1);
              }
            }
          }
        }
      },
      {
        root: container,
        rootMargin: '-15% 0px -55% 0px',
        threshold: 0.1,
      }
    );

    const paragraphNodes = container.querySelectorAll('[data-paragraph-id]');
    paragraphNodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [bookData, setLocation, recordReading]);

  // Render text with non-duplicating contiguous character-mapping algorithm
  // This guarantees every character appears exactly once: NO duplication on re-highlighting!
  const renderHighlightedText = (paragraph: OrganonParagraph) => {
    const text = paragraph.text;
    const pHighlights = highlightsByParagraph.get(paragraph.id);

    if (!pHighlights || pHighlights.length === 0) {
      return text;
    }

    // Sort highlights chronologically so newer highlights take precedence on overlap
    const sorted = [...pHighlights].sort((a, b) => {
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tA - tB;
    });

    // Map each character index to its active highlight
    const charMap: (HighlightItem | null)[] = new Array(text.length).fill(null);
    for (const hl of sorted) {
      const start = Math.max(0, Math.min(hl.start_offset, text.length));
      const end = Math.max(start, Math.min(hl.end_offset, text.length));
      for (let i = start; i < end; i++) {
        charMap[i] = hl;
      }
    }

    // Group adjacent characters into contiguous segments
    const segments: React.ReactNode[] = [];
    let runStart = 0;
    let currentHl: HighlightItem | null = charMap[0] || null;

    for (let i = 1; i <= text.length; i++) {
      const hlAtI = i < text.length ? (charMap[i] ?? null) : null;
      const isBoundary = i === text.length || currentHl?.id !== hlAtI?.id;

      if (isBoundary) {
        const slice = text.substring(runStart, i);
        if (currentHl) {
          const highlightClass =
            currentHl.color === 'yellow'
              ? 'hl-yellow'
              : currentHl.color === 'blue'
              ? 'hl-blue'
              : currentHl.color === 'red'
              ? 'hl-red'
              : 'hl-green';

          const hlItem = currentHl;
          segments.push(
            <mark
              key={`hl-${hlItem.id}-${runStart}`}
              className={`${highlightClass} transition-colors cursor-pointer`}
              title={`Highlight (${hlItem.color}) — Click to manage / unhighlight`}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setSelection({
                  text: slice,
                  paragraphId: hlItem.paragraph_id,
                  bookId: hlItem.book_id || '',
                  chapterTitle: hlItem.chapter_title || '',
                  startOffset: hlItem.start_offset,
                  endOffset: hlItem.end_offset,
                  rect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  },
                });
              }}
            >
              {slice}
            </mark>
          );
        } else {
          segments.push(slice);
        }
        runStart = i;
        currentHl = hlAtI || null;
      }
    }

    return segments;
  };

  const handleCopyParagraph = async (
    text: string,
    parId: string,
    bookTitle: string,
    chTitle: string,
    bekker?: string
  ) => {
    const citation = `"${text}"\n— Aristotle, ${bookTitle} (${chTitle})${bekker ? ` [${bekker}]` : ''}`;
    const success = await copyToClipboard(citation);
    if (success) {
      setCopiedId(parId);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  // Resolve typography styles
  const maxWidthClass =
    typography.maxWidth === 'narrow'
      ? 'max-w-[50ch]'
      : typography.maxWidth === 'wide'
      ? 'max-w-[80ch]'
      : 'max-w-[65ch]';

  const fontFamilyClass =
    typography.fontFamily === 'serif'
      ? 'font-organon-serif'
      : typography.fontFamily === 'sans'
      ? 'font-organon-sans'
      : 'font-organon-mono';

  if (!bookData) {
    return (
      <div className="flex-1 h-full flex items-center justify-center p-12 text-[var(--text-muted)] text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
          <p className="font-title-classical tracking-wider">Unrolling Aristotle's Organon...</p>
        </div>
      </div>
    );
  }

  return (
    <main
      ref={containerRef}
      onMouseUp={updateSelectionFromDOM}
      onTouchEnd={() => setTimeout(updateSelectionFromDOM, 80)}
      className="flex-1 h-full min-h-0 overflow-y-auto px-4 sm:px-8 md:px-12 py-8 transition-colors flex justify-center overscroll-contain"
    >
      <div className={`w-full ${maxWidthClass} transition-all duration-200 space-y-16 pb-36`}>
        {/* Book Series Title Header */}
        <div className="text-center pt-4 pb-8 border-b border-[var(--border-subtle)] space-y-2 select-none">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--accent-gold)] font-bold">
            The Corpus Aristotelicum
          </span>
          <h1 className="font-title-classical text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            {bookData.title}
          </h1>
          <p className="font-serif text-xs text-[var(--text-muted)] italic max-w-md mx-auto">
            {bookData.description || 'The Complete Logical Treatises of Aristotle'}
          </p>
        </div>

        {/* Continuous Book / Treatise Stream */}
        {bookData.books.map((book) => (
          <section key={book.id} id={`book-${book.id}`} className="space-y-12">
            {/* Treatise Big Title Card */}
            <div className="py-6 border-b-2 border-[var(--border-subtle)] space-y-1.5 select-none">
              <div className="flex items-center gap-2 text-xs text-[var(--accent-gold)] font-semibold tracking-wider uppercase font-title-classical">
                <BookOpen className="w-4 h-4" />
                <span>Treatise {book.order}</span>
              </div>
              <h2 className="font-title-classical text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                {book.title}
              </h2>
              {book.greek_title && (
                <div className="text-sm font-serif italic text-[var(--text-secondary)]">
                  {book.greek_title}
                </div>
              )}
              {book.description && (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">
                  {book.description}
                </p>
              )}
            </div>

            {/* Parts Stream */}
            {book.parts.map((part) => (
              <div key={part.id} className="space-y-10">
                <div className="pt-2 select-none">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-1.5 font-title-classical">
                    {part.title}
                  </h3>
                </div>

                {/* Chapters Stream */}
                {part.chapters.map((chapter) => (
                  <article
                    key={chapter.id}
                    id={`ch-${chapter.id}`}
                    className="space-y-6 pt-4"
                  >
                    {/* Chapter Title */}
                    <div className="space-y-1 select-none">
                      <h4 className="font-title-classical text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-snug">
                        {chapter.title}
                      </h4>
                    </div>

                    {/* Paragraphs Stream */}
                    <div className="space-y-6">
                      {chapter.paragraphs.map((par) => {
                        const isFavorited = favoritesMap.has(par.id);
                        const isCurrent = currentParagraphId === par.id;
                        const zenClass = isZenMode
                          ? isCurrent
                            ? 'zen-active'
                            : 'zen-dimmed'
                          : '';

                        return (
                          <div
                            key={par.id}
                            id={`p-${par.id}`}
                            data-paragraph-id={par.id}
                            data-chapter-id={chapter.id}
                            data-book-id={book.id}
                            data-chapter-title={chapter.title}
                            data-full-text={par.text}
                            className={`group relative transition-all duration-300 rounded-xl p-2 -mx-2 hover:bg-[var(--bg-secondary)]/30 ${zenClass}`}
                          >
                            {/* Bekker reference & action toolbar on left/hover */}
                            <div className="flex items-center justify-between pb-1 select-none text-[11px] text-[var(--text-muted)]">
                              {par.bekker ? (
                                <span className="font-mono text-[10px] tracking-wider font-medium text-[var(--accent-gold)] px-1.5 py-0.5 rounded bg-[var(--accent-gold)]/10">
                                  Bekker {par.bekker}
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                  §{par.order}
                                </span>
                              )}

                                {/* Hover actions: Star/Favorite & Copy Citation & Clear Highlights */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                {highlightsByParagraph.get(par.id)?.length ? (
                                  <button
                                    onClick={() => clearParagraphHighlights(par.id)}
                                    title="Clear all highlights in this paragraph"
                                    className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                  >
                                    <Eraser className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}

                                <button
                                  onClick={() =>
                                    toggleFavorite(
                                      par.id,
                                      'paragraph',
                                      `${book.title} (${par.bekker || chapter.title})`,
                                      par.text.slice(0, 100) + '...'
                                    )
                                  }
                                  title={isFavorited ? 'Remove favorite' : 'Star favorite maxim'}
                                  className={`p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors ${
                                    isFavorited ? 'text-amber-500' : 'text-[var(--text-muted)] hover:text-amber-500'
                                  }`}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400' : ''}`}
                                  />
                                </button>

                                <button
                                  onClick={() =>
                                    handleCopyParagraph(
                                      par.text,
                                      par.id,
                                      book.title,
                                      chapter.title,
                                      par.bekker
                                    )
                                  }
                                  title="Copy text with citation"
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                                >
                                  {copiedId === par.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Summary callout badge if available */}
                            {par.summary && (
                              <div className="mb-2 text-[11px] font-sans font-medium text-[var(--text-secondary)] italic border-l-2 border-[var(--accent-gold)]/40 pl-2.5 py-0.5">
                                {par.summary}
                              </div>
                            )}

                            {/* Main Paragraph Text with anchored highlights */}
                            <p
                              style={{
                                fontSize: `${typography.fontSize}px`,
                                lineHeight: typography.lineHeight,
                              }}
                              className={`${fontFamilyClass} text-[var(--text-primary)] text-justify leading-relaxed selection:bg-[var(--selection-bg)]`}
                            >
                              {renderHighlightedText(par)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </section>
        ))}

        {/* Reader Finish */}
        <div className="text-center pt-16 pb-16 sm:pb-8 border-t border-[var(--border-subtle)] space-y-2 select-none text-[var(--text-muted)]">
          <div className="font-title-classical text-xs tracking-widest uppercase">
            ΤΕΛΟΣ — Finis Organi Aristotelis
          </div>
          <p className="text-[11px] font-serif italic">
            "We have completed the discussion of dialectical reasoning, the syllogism, demonstration, and fallacies."
          </p>
        </div>
      </div>
    </main>
  );
};
