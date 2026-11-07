import React, { useState } from 'react';
import { useReaderStore } from '../store/readerStore';
import { HighlightColor } from '../types';
import {
    Highlighter,
    MessageSquarePlus,
    BookA,
    Copy,
    Check,
    X,
    Eraser,
    Trash2,
} from 'lucide-react';

export const SelectionPopover: React.FC = () => {
    const [isNoteInputOpen, setIsNoteInputOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [copied, setCopied] = useState(false);

    const selection = useReaderStore((state) => state.selection);
    const setSelection = useReaderStore((state) => state.setSelection);
    const highlights = useReaderStore((state) => state.highlights);
    const createHighlight = useReaderStore((state) => state.createHighlight);
    const unhighlightSelection = useReaderStore((state) => state.unhighlightSelection);
    const clearParagraphHighlights = useReaderStore((state) => state.clearParagraphHighlights);
    const createNote = useReaderStore((state) => state.createNote);
    const openDictionary = useReaderStore((state) => state.openDictionary);

    if (!selection) return null;

    // Check if current selection touches or overlaps any highlight (full or partial)
    const overlappingHighlights = highlights.filter(
        (h) =>
            h.paragraph_id === selection.paragraphId &&
            h.start_offset < selection.endOffset &&
            h.end_offset > selection.startOffset
    );
    const hasOverlappingHighlight = overlappingHighlights.length > 0;

    // Check how many highlights exist in this paragraph/section
    const paragraphHighlightsCount = highlights.filter(
        (h) => h.paragraph_id === selection.paragraphId
    ).length;

    const handleHighlight = async (color: HighlightColor) => {
        await createHighlight(color);
    };

    const handleSaveNote = async () => {
        if (!noteText.trim()) return;
        await createNote(
            selection.paragraphId,
            noteText.trim(),
            undefined,
            selection.bookId,
            selection.chapterTitle
        );
        setNoteText('');
        setIsNoteInputOpen(false);
    };

    const handleDefine = async () => {
        // Look up either single word or first meaningful word in selection
        const word = selection.text.trim().split(/\s+/)[0];
        await openDictionary(word);
        setSelection(null);
    };

    const handleCopyCitation = () => {
        const citation = `"${selection.text.trim()}"\n— Aristotle, ${selection.bookId.toUpperCase()} (${selection.chapterTitle})`;
        navigator.clipboard.writeText(citation);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
            setSelection(null);
        }, 1200);
    };

    // Position calculation with viewport bounding
    const popoverTop = Math.max(10, selection.rect.top - 54);
    const popoverLeft = Math.min(
        window.innerWidth - 320,
        Math.max(10, selection.rect.left + selection.rect.width / 2 - 140)
    );

    return (
        <div
            style={{ top: `${popoverTop}px`, left: `${popoverLeft}px` }}
            className="absolute z-50 bg-[var(--bg-popover)] border border-[var(--border-color)] rounded-xl shadow-[var(--shadow-soft)] p-1.5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100 select-none"
        >
            {!isNoteInputOpen ? (
                <div className="block sm:flex items-center gap-1">
                    {/* Highlight Color Pickers & Unhighlight Option */}
                    <div className="flex items-center gap-1 px-1.5 py-1 border-r border-[var(--border-subtle)]">
                        <Highlighter className="w-3.5 h-3.5 text-[var(--text-muted)] mr-0.5" />
                        <button
                            onClick={() => handleHighlight('yellow')}
                            title="Yellow Highlight"
                            className="w-4.5 h-4.5 rounded-full bg-amber-300 hover:scale-115 transition-transform border border-amber-400"
                        />
                        <button
                            onClick={() => handleHighlight('blue')}
                            title="Blue Highlight"
                            className="w-4.5 h-4.5 rounded-full bg-sky-300 hover:scale-115 transition-transform border border-sky-400"
                        />
                        <button
                            onClick={() => handleHighlight('green')}
                            title="Green Highlight"
                            className="w-4.5 h-4.5 rounded-full bg-emerald-300 hover:scale-115 transition-transform border border-emerald-400"
                        />
                        <button
                            onClick={() => handleHighlight('red')}
                            title="Red Highlight"
                            className="w-4.5 h-4.5 rounded-full bg-rose-300 hover:scale-115 transition-transform border border-rose-400"
                        />

                        {/* Unhighlight / Remove selection highlight option */}
                        <button
                            onClick={() => unhighlightSelection()}
                            title="Unhighlight selection (removes full and partial highlights)"
                            className={`p-1 rounded transition-colors flex items-center justify-center ml-0.5 ${hasOverlappingHighlight
                                    ? 'text-rose-500 hover:text-rose-600 bg-rose-500/15'
                                    : 'text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-secondary)]'
                                }`}
                        >
                            <Eraser className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Clear section highlights if paragraph has highlights */}
                    {paragraphHighlightsCount > 0 && (
                        <button
                            onClick={() => clearParagraphHighlights(selection.paragraphId)}
                            title={`Clear all highlights in this section (${paragraphHighlightsCount})`}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-500/90 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}

                    {/* Add Note Button */}
                    <button
                        onClick={() => setIsNoteInputOpen(true)}
                        title="Add Note"
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        <span>Note</span>
                    </button>

                    {/* Define / Dictionary Button */}
                    <button
                        onClick={handleDefine}
                        title="Define Word / Philosophical Concept"
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
                    >
                        <BookA className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                        <span>Define</span>
                    </button>

                    {/* Copy with Citation */}
                    <button
                        onClick={handleCopyCitation}
                        title="Copy Text with Scholarly Citation"
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Cite</span>
                            </>
                        )}
                    </button>

                    {/* Dismiss button */}
                    <button
                        onClick={() => setSelection(null)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors ml-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                /* Expandable Inline Note Box */
                <div className="w-72 p-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--accent-gold)]">Add Scholar's Note</span>
                        <button
                            onClick={() => setIsNoteInputOpen(false)}
                            className="hover:text-[var(--text-primary)]"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <textarea
                        autoFocus
                        rows={3}
                        placeholder="Write your philosophical commentary or marginal note..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                    />
                    <div className="flex justify-end gap-1.5">
                        <button
                            onClick={() => setIsNoteInputOpen(false)}
                            className="px-2.5 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNote}
                            className="px-3 py-1 rounded bg-[var(--accent-gold)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
