import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useReaderStore } from '../store/readerStore';
import { HighlightColor } from '../types';
import { copyToClipboard } from '../lib/clipboard';
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
    const popoverRef = useRef<HTMLDivElement>(null);
    const [isNoteInputOpen, setIsNoteInputOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [copied, setCopied] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

    const selection = useReaderStore((state) => state.selection);
    const setSelection = useReaderStore((state) => state.setSelection);
    const highlights = useReaderStore((state) => state.highlights);
    const createHighlight = useReaderStore((state) => state.createHighlight);
    const unhighlightSelection = useReaderStore((state) => state.unhighlightSelection);
    const clearParagraphHighlights = useReaderStore((state) => state.clearParagraphHighlights);
    const createNote = useReaderStore((state) => state.createNote);
    const openDictionary = useReaderStore((state) => state.openDictionary);

    // Calculate smart responsive positioning
    useLayoutEffect(() => {
        if (!selection) return;

        const el = popoverRef.current;
        const popoverWidth = el ? el.offsetWidth : (isNoteInputOpen ? 280 : 340);
        const popoverHeight = el ? el.offsetHeight : (isNoteInputOpen ? 180 : 44);

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Insets to avoid top navigation bar (56px) and bottom mobile navigation bar (56px)
        const topSafeInset = 62;
        const bottomSafeInset = 70;

        // Try placing above selection first
        let top = selection.rect.top - popoverHeight - 8;

        // If not enough room above (near top header), place below selection
        if (top < topSafeInset) {
            top = selection.rect.top + selection.rect.height + 8;
        }

        // Clamp vertically within safe bounds
        const maxTop = Math.max(topSafeInset, vh - popoverHeight - bottomSafeInset);
        top = Math.max(topSafeInset, Math.min(top, maxTop));

        // Horizontal positioning: center on selection
        let left = selection.rect.left + selection.rect.width / 2 - popoverWidth / 2;
        // Clamp horizontally so it never exceeds screen borders
        const maxLeft = Math.max(8, vw - popoverWidth - 8);
        left = Math.max(8, Math.min(left, maxLeft));

        setPosition({ top, left });
    }, [selection, isNoteInputOpen]);

    // Track scroll events so popover follows selection or dismisses if scrolled out of view
    useEffect(() => {
        if (!selection) return;

        const handleScroll = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                setSelection(null);
                return;
            }

            try {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (rect.width > 0 || rect.height > 0) {
                    // If selection has scrolled off screen (under header or off bottom), dismiss
                    if (rect.bottom < 50 || rect.top > window.innerHeight - 50) {
                        setSelection(null);
                        return;
                    }

                    setSelection({
                        ...selection,
                        rect: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                        },
                    });
                }
            } catch {
                // Ignore range measurement errors
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => {
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [selection, setSelection]);

    // Handle outside clicks/taps to dismiss popover cleanly
    useEffect(() => {
        if (!selection) return;

        const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
            if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
                return;
            }

            // Small delay to allow any native selection changes to settle
            setTimeout(() => {
                const sel = window.getSelection();
                if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                    setSelection(null);
                    setIsNoteInputOpen(false);
                }
            }, 100);
        };

        document.addEventListener('mousedown', handleOutsideInteraction);
        document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleOutsideInteraction);
            document.removeEventListener('touchstart', handleOutsideInteraction);
        };
    }, [selection, setSelection]);

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
        const word = selection.text.trim().split(/\s+/)[0] || '';
        if (word) {
            await openDictionary(word);
        }
        setSelection(null);
    };

    const handleCopyCitation = async () => {
        const citation = `"${selection.text.trim()}"\n— Aristotle, ${selection.bookId.toUpperCase()} (${selection.chapterTitle})`;
        const success = await copyToClipboard(citation);
        if (success) {
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
                setSelection(null);
            }, 1200);
        }
    };

    return (
        <div
            ref={popoverRef}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                visibility: position.top === -9999 ? 'hidden' : 'visible',
            }}
            onMouseDown={(e) => {
                // Prevent blurring text selection when tapping toolbar buttons
                const target = e.target as HTMLElement;
                if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
                    e.preventDefault();
                }
            }}
            onTouchStart={(e) => e.stopPropagation()}
            className="fixed z-50 bg-[var(--bg-popover)] border border-[var(--border-color)] rounded-xl shadow-xl backdrop-blur-md p-1.5 flex flex-col gap-1.5 max-w-[calc(100vw-16px)] animate-in fade-in zoom-in-95 duration-100 select-none"
        >
            {!isNoteInputOpen ? (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full px-0.5 py-0.5">
                    {/* Highlight Color Pickers & Unhighlight Option */}
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 border-r border-[var(--border-subtle)] shrink-0">
                        <Highlighter className="w-3.5 h-3.5 text-[var(--text-muted)] mr-0.5 shrink-0" />
                        <button
                            onClick={() => handleHighlight('yellow')}
                            title="Yellow Highlight"
                            className="w-5 h-5 rounded-full bg-amber-300 hover:scale-110 active:scale-95 transition-transform border border-amber-400 shrink-0 shadow-xs"
                        />
                        <button
                            onClick={() => handleHighlight('blue')}
                            title="Blue Highlight"
                            className="w-5 h-5 rounded-full bg-sky-300 hover:scale-110 active:scale-95 transition-transform border border-sky-400 shrink-0 shadow-xs"
                        />
                        <button
                            onClick={() => handleHighlight('green')}
                            title="Green Highlight"
                            className="w-5 h-5 rounded-full bg-emerald-300 hover:scale-110 active:scale-95 transition-transform border border-emerald-400 shrink-0 shadow-xs"
                        />
                        <button
                            onClick={() => handleHighlight('red')}
                            title="Red Highlight"
                            className="w-5 h-5 rounded-full bg-rose-300 hover:scale-110 active:scale-95 transition-transform border border-rose-400 shrink-0 shadow-xs"
                        />

                        {/* Unhighlight / Remove selection highlight option */}
                        <button
                            onClick={() => unhighlightSelection()}
                            title="Unhighlight selection (removes full and partial highlights)"
                            className={`p-1.5 rounded-md transition-colors flex items-center justify-center shrink-0 ml-0.5 ${
                                hasOverlappingHighlight
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
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-500/90 hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors shrink-0"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    )}

                    {/* Add Note Button */}
                    <button
                        onClick={() => setIsNoteInputOpen(true)}
                        title="Add Note"
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors shrink-0"
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        <span>Note</span>
                    </button>

                    {/* Define / Dictionary Button */}
                    <button
                        onClick={handleDefine}
                        title="Define Word / Philosophical Concept"
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors shrink-0"
                    >
                        <BookA className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                        <span>Define</span>
                    </button>

                    {/* Copy with Citation */}
                    <button
                        onClick={handleCopyCitation}
                        title="Copy Text with Scholarly Citation"
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors shrink-0"
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
                        title="Dismiss"
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors shrink-0 ml-auto"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                /* Expandable Inline Note Box */
                <div className="w-[min(288px,calc(100vw-36px))] p-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--accent-gold)]">Add Scholar's Note</span>
                        <button
                            onClick={() => setIsNoteInputOpen(false)}
                            className="p-1 hover:text-[var(--text-primary)] rounded"
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
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)] resize-none"
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
