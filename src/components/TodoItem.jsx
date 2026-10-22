import React, { useState, useRef, useEffect } from 'react';
import CircularCheckbox from './CircularCheckbox';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export default function TodoItem({
  todo,
  isSelected,
  deleteProgress = 0,
  onSelect,
  onToggle,
  onUpdate,
  onDelete,
  isLightMode = false
}) {
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
      onClick={() => onSelect?.(todo)}
      onMouseEnter={() => onSelect?.(todo)}
      tabIndex={0}
      role="checkbox"
      aria-checked={Boolean(todo.completed)}
      className={`group relative flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-xl select-none transition-all duration-150 overflow-hidden outline-none ${
        isSelected
          ? (isLightMode ? 'bg-black/[0.06] backdrop-blur-xs' : 'bg-white/[0.08] backdrop-blur-xs')
          : (isLightMode ? 'hover:bg-black/[0.03] backdrop-blur-xs' : 'hover:bg-white/[0.05] backdrop-blur-xs')
      } ${todo.completed && !isEditing ? 'opacity-60' : 'opacity-100'}`}
    >
      {/* Long-Press DELETE Key Fill Progress Indicator */}
      {deleteProgress > 0 && (
        <div 
          className="absolute inset-y-0 left-0 bg-rose-500/25 pointer-events-none transition-all duration-75 z-0 border-r border-rose-500/50"
          style={{ width: `${Math.min(100, deleteProgress * 100)}%` }}
        />
      )}

      {/* Checkbox */}
      <div className="relative flex items-center justify-center flex-shrink-0 z-10">
        <CircularCheckbox
          checked={Boolean(todo.completed)}
          onChange={() => onToggle?.(todo)}
          isLightMode={isLightMode}
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
            className={`w-full px-2.5 py-1 rounded-lg text-[14.5px] sm:text-[15px] focus:outline-none transition-all border ${
              isLightMode 
                ? 'bg-white/70 border-black/25 text-zinc-950 placeholder-zinc-500 focus:border-black/50 shadow-xs' 
                : 'bg-black/45 border-white/25 text-white placeholder-white/40 focus:border-white/50 shadow-xs'
            }`}
          />
          <button
            type="submit"
            title="Save"
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isLightMode 
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
              isLightMode 
                ? 'text-zinc-600 hover:bg-black/5 active:bg-black/10' 
                : 'text-white/50 hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      ) : (
        <>
          {/* Todo Title */}
          <span
            onClick={() => onToggle?.(todo)}
            onDoubleClick={handleStartEdit}
            className={`flex-1 text-[15px] sm:text-[15.5px] leading-snug tracking-wide transition-all duration-150 break-words z-10 cursor-pointer ${
              todo.completed
                ? (isLightMode 
                    ? 'line-through text-zinc-900/45 font-normal drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]' 
                    : 'line-through text-white/40 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]')
                : (isLightMode 
                    ? 'text-zinc-950 font-medium group-hover:text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]' 
                    : 'text-white/95 font-normal group-hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]')
            }`}
          >
            {todo.title}
          </span>

          {/* Inline Action Icons (Pencil & Trash) */}
          <div 
            className="flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 z-10 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleStartEdit}
              title="Edit task"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                isLightMode 
                  ? 'text-zinc-600 hover:text-black hover:bg-black/[0.08]' 
                  : 'text-white/60 hover:text-white hover:bg-white/[0.14]'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete?.(todo)}
              title="Delete task"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 ${
                isLightMode 
                  ? 'text-zinc-600 hover:text-rose-600 hover:bg-rose-500/10' 
                  : 'text-white/60 hover:text-rose-400 hover:bg-rose-500/20'
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
