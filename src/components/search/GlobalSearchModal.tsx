import React, { useState, useEffect, useRef } from 'react';
import { Block, Task, Attachment, Note, SearchResult } from '../../types';
import { Search, X, Layers, CheckSquare, Paperclip, BookOpen, ArrowRight } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface GlobalSearchModalProps {
  isOpen: boolean;
  blocks: Block[];
  tasks: Task[];
  attachments: Attachment[];
  notes: Note[];
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  blocks,
  tasks,
  attachments,
  notes,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search Index Calculation
  const q = query.trim().toLowerCase();

  const results: SearchResult[] = [];

  if (q.length > 0) {
    // Search Blocks
    blocks.forEach((block) => {
      if (
        block.name.toLowerCase().includes(q) ||
        block.description?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `block-${block.id}`,
          type: 'block',
          title: block.name,
          subtitle: block.description || 'Block workspace',
          blockId: block.id,
          blockName: block.name,
          badge: 'Block',
          item: block,
        });
      }
    });

    // Search Tasks
    tasks.forEach((task) => {
      if (
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q)
      ) {
        const parentBlock = blocks.find((b) => b.id === task.blockId);
        results.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          subtitle: `In ${parentBlock?.name || 'Block'} • ${
            task.completed ? 'Completed' : 'Pending'
          }`,
          blockId: task.blockId,
          blockName: parentBlock?.name || 'Block',
          badge: task.completed ? 'Done Task' : 'Task',
          item: task,
        });
      }
    });

    // Search Notes
    notes.forEach((note) => {
      if (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
      ) {
        const parentBlock = blocks.find((b) => b.id === note.blockId);
        results.push({
          id: `note-${note.id}`,
          type: 'note',
          title: note.title,
          subtitle: `Note in ${parentBlock?.name || 'Block'}`,
          blockId: note.blockId,
          blockName: parentBlock?.name || 'Block',
          badge: 'Note',
          item: note,
        });
      }
    });

    // Search Attachments
    attachments.forEach((att) => {
      if (att.name.toLowerCase().includes(q)) {
        const parentBlock = blocks.find((b) => b.id === att.blockId);
        results.push({
          id: `att-${att.id}`,
          type: 'attachment',
          title: att.name,
          subtitle: `${att.type.toUpperCase()} in ${parentBlock?.name || 'Block'}`,
          blockId: att.blockId,
          blockName: parentBlock?.name || 'Block',
          badge: 'File',
          item: att,
        });
      }
    });
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        soundService.playTap();
        hapticsService.light();
        onSelectResult(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      soundService.playDismiss();
      onClose();
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'block':
        return <Layers className="w-4 h-4 text-sky-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'note':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'attachment':
        return <Paperclip className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => {
          soundService.playDismiss();
          onClose();
        }}
      />

      {/* Command Palette Card */}
      <div className="liquid-glass relative w-full max-w-2xl rounded-3xl shadow-2xl z-10 overflow-hidden animate-fade-in">
        {/* Specular Inner Rim */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search className="w-5 h-5 text-sky-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search blocks, tasks, files, notes (e.g. 'DSA', 'Music', 'Revision')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none text-white placeholder:text-white/40 text-base outline-none font-sans"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-white/40 bg-white/5 rounded border border-white/10">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
          {q.length === 0 ? (
            <div className="p-8 text-center text-xs text-white/40">
              Type anything to search instantly across all your life blocks.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-white/70">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-white/40 mt-1">Try another keyword or block name.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundService.playTap();
                      hapticsService.light();
                      onSelectResult(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-500/20 border border-sky-400/30 text-white'
                        : 'hover:bg-white/[0.04] text-white/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                        {getResultIcon(item.type)}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-white/50 truncate">{item.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-white/60 border border-white/10">
                        {item.badge}
                      </span>
                      {isSelected && <ArrowRight className="w-4 h-4 text-sky-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
