import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { useReaderStore } from '../store/readerStore';
import { performSemanticSearch, ParagraphSearchContext } from '../lib/semanticSearch';
import { SearchResultItem } from '../types';
import {
  Search,
  Sparkles,
  FileText,
  X,
  BookOpen,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface FuseSearchItem {
  paragraphId: string;
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  bekker?: string;
  summary?: string;
  text: string;
}

export const SearchModal: React.FC = () => {
  const isSearchOpen = useReaderStore((state) => state.isSearchOpen);
  const setSearchOpen = useReaderStore((state) => state.setSearchOpen);
  const bookData = useReaderStore((state) => state.bookData);

  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'fulltext' | 'semantic'>('fulltext');
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  // Flatten all paragraphs for search indexing
  const { allSearchItems, paragraphSearchContexts } = useMemo(() => {
    const items: FuseSearchItem[] = [];
    const contexts: ParagraphSearchContext[] = [];

    if (!bookData?.books) return { allSearchItems: items, paragraphSearchContexts: contexts };

    for (const book of bookData.books) {
      for (const part of book.parts) {
        for (const ch of part.chapters) {
          for (const p of ch.paragraphs) {
            items.push({
              paragraphId: p.id,
              bookId: book.id,
              bookTitle: book.title,
              chapterId: ch.id,
              chapterTitle: ch.title,
              bekker: p.bekker,
              summary: p.summary,
              text: p.text,
            });

            contexts.push({
              paragraph: p,
              bookId: book.id,
              bookTitle: book.title,
              chapterId: ch.id,
              chapterTitle: ch.title,
            });
          }
        }
      }
    }

    return { allSearchItems: items, paragraphSearchContexts: contexts };
  }, [bookData]);

  // Configure Fuse.js for full-text search
  const fuse = useMemo(() => {
    return new Fuse(allSearchItems, {
      keys: [
        { name: 'text', weight: 0.6 },
        { name: 'summary', weight: 0.3 },
        { name: 'bekker', weight: 0.1 },
      ],
      includeMatches: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [allSearchItems]);

  // Execute search when query, mode, or filter changes
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        if (searchMode === 'fulltext') {
          // Fuse.js local full-text search
          const fuseResults = fuse.search(q);
          const filtered = fuseResults
            .filter((res) =>
              selectedBookFilter === 'all' ? true : res.item.bookId === selectedBookFilter
            )
            .map((res) => {
              const text = res.item.text;
              // Build highlighted snippet
              const lowerText = text.toLowerCase();
              const lowerQ = q.toLowerCase();
              const idx = lowerText.indexOf(lowerQ);

              const start = Math.max(0, idx - 40);
              const end = Math.min(text.length, idx + q.length + 90);
              let snippet = text.substring(start, end);
              if (start > 0) snippet = '...' + snippet;
              if (end < text.length) snippet = snippet + '...';

              return {
                paragraphId: res.item.paragraphId,
                bookId: res.item.bookId,
                bookTitle: res.item.bookTitle,
                chapterId: res.item.chapterId,
                chapterTitle: res.item.chapterTitle,
                bekker: res.item.bekker,
                snippet: res.item.summary ? `[${res.item.summary}] ${snippet}` : snippet,
                fullText: text,
                isSemantic: false,
              };
            });

          if (isMounted) {
            setResults(filtered.slice(0, 25));
            setIsSearching(false);
          }
        } else {
          // Semantic Search via @xenova/transformers / embeddings
          const candidateContexts =
            selectedBookFilter === 'all'
              ? paragraphSearchContexts
              : paragraphSearchContexts.filter((c) => c.bookId === selectedBookFilter);

          const semResults = await performSemanticSearch(q, candidateContexts, 15);
          if (isMounted) {
            setResults(semResults);
            setIsSearching(false);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) setIsSearching(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, searchMode, selectedBookFilter, fuse, paragraphSearchContexts]);

  if (!isSearchOpen) return null;

  const handleSelectResult = (paragraphId: string) => {
    setSearchOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`p-${paragraphId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('zen-active');
        setTimeout(() => el.classList.remove('zen-active'), 1800);
      }
    }, 150);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--bg-popover)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center gap-3">
          <Search className="w-5 h-5 text-[var(--accent-gold)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Aristotle's Organon (e.g., 'syllogism', 'substance', 'homonyms')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="text-xs px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-subtle)]"
          >
            ESC
          </button>
        </div>

        {/* Search Mode Toggle & Treatise Filters */}
        <div className="px-4 py-2.5 bg-[var(--bg-secondary)]/50 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg-primary)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={() => setSearchMode('fulltext')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                searchMode === 'fulltext'
                  ? 'bg-[var(--accent-gold)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className='flex'>Full-Text <span className='hidden sm:flex'>(Fuse.js)</span></span>
            </button>
            <button
              onClick={() => setSearchMode('semantic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                searchMode === 'semantic'
                  ? 'bg-[var(--accent-gold)] text-white shadow-xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className='flex'>Semantic <span className='hidden sm:flex'>Search (Transformers)</span></span>
            </button>
          </div>

          {/* Book Filter Select */}
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={selectedBookFilter}
              onChange={(e) => setSelectedBookFilter(e.target.value)}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">All Treatises</option>
              <option value="categories">Categories</option>
              <option value="on-interpretation">On Interpretation</option>
              <option value="prior-analytics">Prior Analytics</option>
              <option value="posterior-analytics">Posterior Analytics</option>
              <option value="topics">Topics</option>
              <option value="sophistical-refutations">Sophistical Refutations</option>
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {isSearching ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
              <span>Consulting the Lyceum archives...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <div
                key={item.paragraphId}
                onClick={() => handleSelectResult(item.paragraphId)}
                className="p-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl cursor-pointer transition-colors space-y-1.5 group shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-title-classical font-semibold text-[var(--accent-gold)]">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{item.bookTitle}</span>
                    <span className="text-[var(--text-muted)] font-serif font-normal">
                      • {item.chapterTitle}
                    </span>
                  </div>
                  {item.bekker && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                      {item.bekker}
                    </span>
                  )}
                  {item.similarityScore && (
                    <span className="text-[10px] font-mono text-emerald-500 font-semibold">
                      {Math.round(item.similarityScore * 100)}% match
                    </span>
                  )}
                </div>

                <p className="font-serif text-xs text-[var(--text-primary)] leading-relaxed">
                  {item.snippet}
                </p>

                <div className="flex items-center justify-end text-[11px] text-[var(--accent-gold)] group-hover:translate-x-0.5 transition-transform gap-1 font-medium">
                  <span>Jump to text</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs">
              No matching propositions found for "{query}".
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs space-y-1">
              <p>Type keywords or philosophical questions.</p>
              <p className="text-[11px] opacity-75">
                Semantic mode finds passages by meaning rather than exact keywords.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
