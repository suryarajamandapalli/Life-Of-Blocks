import React, { useState, useEffect } from 'react';
import { X, FileText, Check } from 'lucide-react';

const STORAGE_KEY = 'lob_scratchpad_notes';

export default function QuickNotesModal({ isOpen, onClose }) {
  const [notes, setNotes] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setNotes(saved);
    } catch {
      // Ignore
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    try {
      localStorage.setItem(STORAGE_KEY, val);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 1200);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-modal-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg p-5 sm:p-6 rounded-3xl smoked-modal shadow-2xl border border-white/15 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-semibold tracking-wide">Quick Scratchpad</h3>
          </div>
          <div className="flex items-center gap-3">
            {savedStatus ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <Check className="w-3 h-3" /> Saved
              </span>
            ) : (
              <span className="text-[11px] text-white/40 font-mono">Auto-saving</span>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Jot down quick thoughts, ideas, links, or temporary notes here..."
          className="w-full flex-1 min-h-[220px] bg-black/40 text-sm text-white/90 placeholder-white/30 p-3.5 rounded-2xl border border-white/10 focus:border-white/25 focus:outline-none resize-none font-mono leading-relaxed select-text"
        />

        <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
          <span>{notes.length} characters</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
