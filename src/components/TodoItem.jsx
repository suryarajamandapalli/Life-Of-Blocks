import React, { useState, useRef, useEffect } from 'react';
import CircularCheckbox from './CircularCheckbox';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useAdaptiveContrast } from '../hooks/useAdaptiveContrast';

export default function TodoItem({
  todo,
  wallpaper,
  isSelected,
  deleteProgress = 0,
  onSelect,
  onToggle,
  onUpdate,
  onDelete
}) {
  const rowRef = useRef(null);
  // Each task independently samples the exact wallpaper pixels behind itself
  const rowContrast = useAdaptiveContrast(rowRef, wallpaper);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.title || '');
  const editInputRef = useRef(null);

  useEffect(() => {
    setEditText(todo.title || '');
  }, [todo.title]);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e) => {
    e?.stopPropagation();
    setEditText(todo.title || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.title) {
      onUpdate?.(todo.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e) => {
    e?.stopPropagation();
    setEditText(todo.title || '');
    setIsEditing(false);
  };

  return (
    <div
      ref={rowRef}
      onClick={() => onSelect?.(todo)}
      onMouseEnter={() => onSelect?.(todo)}
      tabIndex={0}
      role="checkbox"
      aria-checked={Boolean(todo.completed)}
      className={`group relative flex items-center gap-3 px-1.5 py-2 sm:py-2 select-none outline-none transition-colors duration-250 ease-out ${
        todo.completed && !isEditing ? 'opacity-55' : 'opacity-100'
      }`}
    >
      {/* Desktop hold-Del delete bar indicator */}
      {deleteProgress > 0 && (
        <div 
          className="absolute inset-y-0 left-0 bg-rose-500/25 pointer-events-none transition-all duration-75 z-0 border-r border-rose-500/50 rounded-sm"
          style={{ width: `${Math.min(100, deleteProgress * 100)}%` }}
        />
      )}

      {/* Checkbox: Independently adapts to local contrast */}
      <div className="relative flex items-center justify-center flex-shrink-0 z-10">
        <CircularCheckbox
          checked={Boolean(todo.completed)}
          onChange={() => onToggle?.(todo)}
          isLightMode={rowContrast.isLight}
        />
      </div>

      {/* Inline Editing Form */}
      {isEditing ? (
        <form 
          onSubmit={handleSaveEdit} 
          className="flex-1 flex items-center gap-1.5 z-10" 
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                handleCancelEdit(e);
              }
            }}
            maxLength={140}
            className={`w-full px-2.5 py-1 rounded-lg text-[14.5px] sm:text-[15px] focus:outline-none transition-colors duration-250 border ${
              rowContrast.isLight 
                ? 'bg-white/75 border-black/25 text-[#111111] placeholder-zinc-500 focus:border-black/50 shadow-xs' 
                : 'bg-black/45 border-white/25 text-white placeholder-white/40 focus:border-white/50 shadow-xs'
            }`}
          />
          <button
            type="submit"
            title="Save"
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              rowContrast.isLight 
                ? 'text-emerald-700 hover:bg-black/5 active:bg-black/10' 
                : 'text-emerald-400 hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            title="Cancel"
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              rowContrast.isLight 
                ? 'text-[#111111]/60 hover:bg-black/5 active:bg-black/10' 
                : 'text-white/50 hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      ) : (
        <>
          {/* Todo Title: Direct floating text printed onto wallpaper */}
          <span
            onClick={() => onToggle?.(todo)}
            onDoubleClick={handleStartEdit}
            className={`flex-1 text-[15px] sm:text-[15.5px] leading-snug tracking-wide transition-colors duration-250 ease-out break-words z-10 cursor-pointer ${
              todo.completed
                ? (rowContrast.isLight
                    ? 'line-through text-[#111111]/45 font-normal'
                    : 'line-through text-[#FFFFFF]/45 font-normal')
                : (rowContrast.isLight
                    ? `text-[#111111] font-medium ${rowContrast.textShadow}`
                    : `text-[#FFFFFF] font-normal ${rowContrast.textShadow}`)
            }`}
          >
            {todo.title}
          </span>

          {/* Action Icons: Edit & Delete */}
          <div 
            className="flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 z-10 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleStartEdit}
              title="Edit task"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                rowContrast.isLight 
                  ? 'text-[#111111]/70 hover:text-[#111111] hover:bg-black/10' 
                  : 'text-white/70 hover:text-white hover:bg-white/15'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(todo)}
              title="Delete task"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                rowContrast.isLight 
                  ? 'text-[#111111]/70 hover:text-rose-600 hover:bg-rose-500/10' 
                  : 'text-white/70 hover:text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Deleting Indicator Label for Hold-Delete */}
      {deleteProgress > 0 && (
        <span className="text-[11px] font-mono font-medium text-rose-500 dark:text-rose-300 z-10 flex-shrink-0 animate-pulse ml-2">
          Hold Del ({Math.round(deleteProgress * 100)}%)
        </span>
      )}
    </div>
  );
}
