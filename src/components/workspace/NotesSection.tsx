import React, { useState, useEffect } from 'react';
import { Note, AccentColor } from '../../types';
import { GlassButton } from '../ui/GlassButton';
import { Plus, Trash2, BookOpen, Eye, Edit3, Check, Clock } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';
import { formatRelativeTime } from '../../utils/formatters';

interface NotesSectionProps {
  blockId: string;
  accent: AccentColor;
  notes: Note[];
  onSaveNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  blockId,
  notes,
  onSaveNote,
  onDeleteNote,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Sync state when notes or selected note changes
  useEffect(() => {
    if (selectedNoteId) {
      const current = notes.find((n) => n.id === selectedNoteId);
      if (current) {
        setTitle(current.title);
        setContent(current.content);
        setIsSaved(true);
      }
    } else if (notes.length > 0) {
      setSelectedNoteId(notes[0].id);
      setTitle(notes[0].title);
      setContent(notes[0].content);
      setIsSaved(true);
    } else {
      setTitle('');
      setContent('');
    }
  }, [selectedNoteId, notes]);

  const handleCreateNewNote = () => {
    soundService.playTap();
    hapticsService.light();

    const newNote: Note = {
      id: `note-${Date.now()}`,
      blockId,
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onSaveNote(newNote);
    setSelectedNoteId(newNote.id);
    setTitle(newNote.title);
    setContent(newNote.content);
    setIsPreview(false);
  };

  const handleManualSave = () => {
    if (!selectedNoteId) return;
    const current = notes.find((n) => n.id === selectedNoteId);
    if (!current) return;

    soundService.playTap();
    hapticsService.light();

    const updated: Note = {
      ...current,
      title: title.trim() || 'Untitled Note',
      content,
      updatedAt: Date.now(),
    };

    onSaveNote(updated);
    setIsSaved(true);
  };

  // Simple clean markdown parser for instant preview
  const renderMarkdown = (text: string) => {
    if (!text.trim()) {
      return <p className="text-white/40 italic">Empty note. Type something...</p>;
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-semibold text-sky-300 mt-3 mb-1.5">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-medium text-white/90 mt-2 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-white/80 my-0.5 text-sm">
            {line.slice(2)}
          </li>
        );
      }
      if (line.startsWith('```')) {
        return (
          <div key={idx} className="my-2 p-3 bg-black/40 rounded-xl font-mono text-xs text-sky-200 border border-white/10 overflow-x-auto">
            {line.replace(/```/g, '')}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-white/80 my-1 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-16 rounded-3xl bg-white/[0.03] border border-dashed border-white/15 p-8">
        <BookOpen className="w-10 h-10 text-white/30 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">No Notes in this Block</h3>
        <p className="text-sm text-white/50 max-w-sm mx-auto mb-6">
          Capture formulae, plans, meeting takeaways, and insights for this life area.
        </p>
        <GlassButton variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreateNewNote}>
          Create Note
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Notes Sidebar List */}
      <div className="md:col-span-4 space-y-2">
        <div className="flex items-center justify-between pb-2 mb-1">
          <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
            Notes ({notes.length})
          </span>
          <GlassButton
            size="sm"
            variant="glass"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleCreateNewNote}
          >
            New
          </GlassButton>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
          {notes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => {
                  soundService.playTap();
                  setSelectedNoteId(note.id);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-400/40 shadow-glass-sm'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">{note.title}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundService.playDismiss();
                      onDeleteNote(note.id);
                    }}
                    className="text-white/30 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-white/40 truncate mt-1">
                  {note.content.replace(/[#*`]/g, '') || 'Empty note'}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/30 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{formatRelativeTime(note.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note Editor / Preview Area */}
      <div className="md:col-span-8 rounded-3xl bg-white/[0.04] border border-white/[0.12] p-6 backdrop-blur-2xl shadow-glass-md flex flex-col min-h-[500px]">
        {/* Editor Controls Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Note title..."
            className="flex-1 bg-transparent border-none text-lg font-bold text-white outline-none placeholder:text-white/30"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isPreview
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                  : 'bg-white/[0.06] text-white/60 hover:text-white border-white/10'
              }`}
            >
              {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isPreview ? 'Edit' : 'Preview'}</span>
            </button>

            <GlassButton
              size="sm"
              variant={isSaved ? 'glass' : 'primary'}
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={handleManualSave}
            >
              {isSaved ? 'Saved' : 'Save'}
            </GlassButton>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col">
          {isPreview ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 prose prose-invert max-w-none">
              {renderMarkdown(content)}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Write your note with markdown support (# Heading, - List, ``` Code)..."
              className="w-full flex-1 bg-transparent border-none text-sm text-white/90 placeholder:text-white/30 outline-none resize-none leading-relaxed font-sans"
            />
          )}
        </div>
      </div>
    </div>
  );
};
