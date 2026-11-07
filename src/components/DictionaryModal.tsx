import React from 'react';
import { useReaderStore } from '../store/readerStore';
import {
  BookA,
  Volume2,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const DictionaryModal: React.FC = () => {
  const dictionaryModal = useReaderStore((state) => state.dictionaryModal);
  const closeDictionary = useReaderStore((state) => state.closeDictionary);

  if (!dictionaryModal.isOpen) return null;

  const { word, loading, result } = dictionaryModal;

  const speakWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--bg-popover)] border border-[var(--border-color)] rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookA className="w-5 h-5 text-[var(--accent-gold)]" />
            <span className="font-title-classical font-semibold text-xs tracking-wider uppercase text-[var(--text-primary)]">
              Lexicon & Classical Inquiries
            </span>
          </div>
          <button
            onClick={closeDictionary}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          {loading ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />
              <span>Consulting the philosophical dictionaries...</span>
            </div>
          ) : result ? (
            <>
              {/* Word & Phonetic Title */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-title-classical text-2xl font-bold text-[var(--text-primary)]">
                    {result.word}
                  </h3>
                  {result.phonetic && (
                    <span className="text-sm font-mono text-[var(--text-muted)]">
                      {result.phonetic}
                    </span>
                  )}
                </div>

                <button
                  onClick={speakWord}
                  title="Listen to pronunciation"
                  className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--accent-gold)]/20 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Etymology if available */}
              {result.origin && (
                <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] italic">
                  <span className="font-semibold not-italic text-[var(--text-primary)] mr-1">
                    Etymology:
                  </span>
                  {result.origin}
                </div>
              )}

              {/* Definitions list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Definitions
                </h4>
                {result.meanings.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1.5"
                  >
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                      {m.partOfSpeech}
                    </span>
                    <p className="font-serif text-xs text-[var(--text-primary)] leading-relaxed">
                      {m.definition}
                    </p>
                    {m.example && (
                      <p className="font-serif text-[11px] text-[var(--text-secondary)] italic pl-2 border-l-2 border-[var(--accent-gold)]/50">
                        "{m.example}"
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Wikipedia Excerpt if available */}
              {result.wikipediaExcerpt && (
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Encyclopedic Context</span>
                  </div>
                  <p className="font-serif text-[var(--text-secondary)] leading-relaxed">
                    {result.wikipediaExcerpt}
                  </p>
                  {result.wikipediaUrl && (
                    <a
                      href={result.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-gold)] hover:underline font-medium pt-1"
                    >
                      Read full article on Wikipedia <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              No definition found for "{word}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 flex justify-end">
          <button
            onClick={closeDictionary}
            className="px-4 py-1.5 rounded-lg bg-[var(--accent-gold)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
