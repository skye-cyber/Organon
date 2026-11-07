import React, { useState } from 'react';
import { useReaderStore } from '../store/readerStore';
import {
  X,
  Bookmark,
  BrainCircuit,
  Star,
  Target,
  Trash2,
  ExternalLink,
  Highlighter,
  MessageSquare,
  BookOpen,
  Calendar,
  Flame,
  Award,
} from 'lucide-react';

export const NotesPanel: React.FC = () => {
  const isNotesOpen = useReaderStore((state) => state.isNotesOpen);
  const setNotesOpen = useReaderStore((state) => state.setNotesOpen);
  const activeTab = useReaderStore((state) => state.activeNotesTab);
  const setActiveTab = useReaderStore((state) => state.setActiveNotesTab);
  const isZenMode = useReaderStore((state) => state.isZenMode);

  const highlights = useReaderStore((state) => state.highlights);
  const notes = useReaderStore((state) => state.notes);
  const favorites = useReaderStore((state) => state.favorites);
  const dailyStats = useReaderStore((state) => state.dailyStats);
  const deleteHighlight = useReaderStore((state) => state.deleteHighlight);
  const deleteNote = useReaderStore((state) => state.deleteNote);
  const toggleFavorite = useReaderStore((state) => state.toggleFavorite);

  if (isZenMode || !isNotesOpen) return null;

  const jumpToParagraph = (paragraphId: string) => {
    const el = document.getElementById(`p-${paragraphId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('zen-active');
      setTimeout(() => el.classList.remove('zen-active'), 1500);
    }
    // On mobile devices, close Notes panel after jumping to context
    if (window.innerWidth < 768) {
      setNotesOpen(false);
    }
  };

  // Group highlights and notes by chapter for "My Mind" tab
  const groupedContext: Record<
    string,
    {
      bookId: string;
      chapterTitle: string;
      items: Array<{
        type: 'highlight' | 'note';
        id: string;
        text: string;
        paragraphId: string;
        color?: string;
      }>;
    }
  > = {};

  highlights.forEach((h) => {
    const key = h.chapter_title || h.paragraph_id;
    if (!groupedContext[key]) {
      groupedContext[key] = {
        bookId: h.book_id || 'organon',
        chapterTitle: h.chapter_title || 'General',
        items: [],
      };
    }
    groupedContext[key].items.push({
      type: 'highlight',
      id: h.id,
      text: h.selected_text,
      paragraphId: h.paragraph_id,
      color: h.color,
    });
  });

  notes.forEach((n) => {
    const key = n.chapter_title || n.paragraph_id;
    if (!groupedContext[key]) {
      groupedContext[key] = {
        bookId: n.book_id || 'organon',
        chapterTitle: n.chapter_title || 'General',
        items: [],
      };
    }
    groupedContext[key].items.push({
      type: 'note',
      id: n.id,
      text: n.note_text,
      paragraphId: n.paragraph_id,
    });
  });

  const dailyGoalWords = 600;
  const progressRatio = Math.min(100, Math.round((dailyStats.words_read / dailyGoalWords) * 100));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={() => setNotesOpen(false)}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs hidden animate-in fade-in duration-150"
      />

      <aside className="fixed md:static inset-y-0 right-0 z-50 md:z-20 w-80 sm:w-92 h-full flex-shrink-0 bg-[var(--bg-popover)] md:bg-[var(--bg-secondary)]/50 border-l border-[var(--border-subtle)] flex flex-col transition-all select-none shadow-2xl md:shadow-none animate-in slide-in-from-right-4 duration-150">
        {/* Panel Top Header */}
        <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[var(--accent-gold)]" />
            <h2 className="font-title-classical font-semibold text-xs tracking-wider uppercase text-[var(--text-primary)]">
              Marginalia & Intellect
            </h2>
          </div>
          <button
            onClick={() => setNotesOpen(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs navigation */}
        <div className="grid grid-cols-4 p-1.5 border-b border-[var(--border-subtle)] gap-1 text-xs">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'feed'
                ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
            title="Chronological Feed"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('mymind')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'mymind'
                ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
            title="My Mind - Grouped by Chapter"
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Mind</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
            title="Starred Passages"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favs</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
            title="Daily Reading Goal & Stats"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Goals</span>
          </button>
        </div>

        {/* Tab 1: Chronological Feed */}
        {activeTab === 'feed' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {highlights.length === 0 && notes.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-xs space-y-2">
                <Highlighter className="w-8 h-8 mx-auto opacity-40 text-[var(--accent-gold)]" />
                <p>No highlights or notes recorded yet.</p>
                <p className="text-[11px] opacity-75">
                  Select any text in Aristotle's treatises to highlight or add marginalia.
                </p>
              </div>
            ) : (
              <>
                {/* Notes first */}
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1 font-medium text-[var(--accent-gold)]">
                        <MessageSquare className="w-3 h-3" />
                        Scholar's Note
                      </span>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="text-stone-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-serif text-[var(--text-primary)] italic leading-relaxed">
                      "{n.note_text}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                      <span className="text-[var(--text-muted)] truncate max-w-[170px]">
                        {n.chapter_title || 'Aristotle'}
                      </span>
                      <button
                        onClick={() => jumpToParagraph(n.paragraph_id)}
                        className="flex items-center gap-1 text-[var(--accent-gold)] hover:underline font-medium"
                      >
                        Jump <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Highlights */}
                {highlights.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xs space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            h.color === 'yellow'
                              ? 'bg-amber-400'
                              : h.color === 'blue'
                              ? 'bg-sky-400'
                              : h.color === 'red'
                              ? 'bg-rose-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        Highlight
                      </span>
                      <button
                        onClick={() => deleteHighlight(h.id)}
                        className="text-stone-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                        title="Delete Highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="font-serif text-[var(--text-primary)] leading-relaxed">
                      "{h.selected_text}"
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                      <span className="text-[var(--text-muted)] truncate max-w-[170px]">
                        {h.chapter_title || 'Treatise'}
                      </span>
                      <button
                        onClick={() => jumpToParagraph(h.paragraph_id)}
                        className="flex items-center gap-1 text-[var(--accent-gold)] hover:underline font-medium"
                      >
                        Context <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Tab 2: My Mind (Grouped by chapter) */}
        {activeTab === 'mymind' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {Object.keys(groupedContext).length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-xs space-y-2">
                <BrainCircuit className="w-8 h-8 mx-auto opacity-40 text-[var(--accent-gold)]" />
                <p>Your mind dashboard is empty.</p>
                <p className="text-[11px] opacity-75">
                  Highlights and notes are automatically synthesized here by treatise chapter.
                </p>
              </div>
            ) : (
              Object.entries(groupedContext).map(([chapterKey, group]) => (
                <div
                  key={chapterKey}
                  className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 space-y-2.5 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-[var(--border-subtle)]">
                    <BookOpen className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                    <h4 className="font-title-classical font-semibold text-[var(--text-primary)] truncate">
                      {group.chapterTitle}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => jumpToParagraph(item.paragraphId)}
                        className="p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-subtle)] cursor-pointer transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span className="uppercase tracking-wider font-semibold">
                            {item.type === 'note' ? 'Marginal Note' : 'Highlight'}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                        <p className="font-serif text-[var(--text-primary)] line-clamp-3 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Favorites */}
        {activeTab === 'favorites' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)] text-xs space-y-2">
                <Star className="w-8 h-8 mx-auto opacity-40 text-[var(--accent-gold)]" />
                <p>No favorites starred yet.</p>
                <p className="text-[11px] opacity-75">
                  Hover over any paragraph and click the star to save memorable Aristotelian maxims.
                </p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-title-classical font-semibold text-[var(--accent-gold)] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      {fav.title || 'Aristotle'}
                    </span>
                    <button
                      onClick={() => toggleFavorite(fav.target_id, fav.item_type)}
                      className="text-amber-500 hover:text-stone-400 transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="font-serif text-[var(--text-primary)] leading-relaxed italic">
                    "{fav.preview_text}"
                  </p>

                  <div className="text-right pt-1 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => jumpToParagraph(fav.target_id)}
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-gold)] hover:underline font-medium"
                    >
                      Read in context <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Reading Goals & Stats */}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Progress Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-title-classical font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[var(--accent-gold)]" />
                  Today's Goal
                </span>
                <span className="text-xs font-mono font-bold text-[var(--accent-gold)]">
                  {dailyStats.words_read} / {dailyGoalWords} words
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] text-right">
                {progressRatio >= 100
                  ? 'Goal achieved! Philosophical enlightenment unlocks.'
                  : `${dailyGoalWords - dailyStats.words_read} words remaining today.`}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px]">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  <span>Paragraphs</span>
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
                  {dailyStats.paragraphs_read}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>Minutes</span>
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">
                  {dailyStats.minutes_spent || 1} min
                </div>
              </div>
            </div>

            {/* Reading Streak */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)] text-xs">
                  Peripatetic Habit
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Daily contemplation of Aristotle's logical treatises builds disciplined thinking.
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
