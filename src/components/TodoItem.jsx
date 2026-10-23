import React, { useState, useRef, useEffect, useCallback } from 'react';
import CircularCheckbox from './CircularCheckbox';
import { Pencil, Trash2, Check, X, Box, ChevronRight } from 'lucide-react';
import { sound } from '../services/sound';

const LONG_PRESS_DURATION = 3000; // 3 seconds to convert to Sub-Block

export default function TodoItem({
  todo,
  isLight = false,
  isSelected,
  deleteProgress = 0,
  subBlockTaskCount = 0,
  onSelect,
  onToggle,
  onUpdate,
  onDelete,
  onConvertToBlock,
  onOpenSubBlock
}) {
  const rowRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.title || '');
  const [showActions, setShowActions] = useState(false);
  const editInputRef = useRef(null);
  const actionTimerRef = useRef(null);

  // 3-Second Long Press to Convert into Block state
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdStartRef = useRef(0);
  const holdFrameRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setEditText(todo.title || '');
  }, [todo.title]);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing]);

  // Clean up animation frames on unmount
  useEffect(() => {
    return () => {
      if (holdFrameRef.current) cancelAnimationFrame(holdFrameRef.current);
    };
  }, []);

  // ----------------- LONG PRESS LOGIC (3s Hold) -----------------
  const cancelHold = useCallback(() => {
    if (holdFrameRef.current) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    holdStartRef.current = 0;
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const triggerConversion = useCallback(() => {
    cancelHold();
    // Sound & Haptic Feedback
    sound.playBlockTransform();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 80]);
    }
    onConvertToBlock?.(todo);
  }, [cancelHold, onConvertToBlock, todo]);

  const startHold = useCallback((e) => {
    // Ignore right click or when editing or when already holding
    if (e.button && e.button !== 0) return;
    if (isEditing) return;

    // Record start time
    holdStartRef.current = Date.now();
    setIsHolding(true);
    setHoldProgress(0.01);

    const step = () => {
      if (!holdStartRef.current) return;
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(1, elapsed / LONG_PRESS_DURATION);
      setHoldProgress(progress);

      if (progress < 1) {
        holdFrameRef.current = requestAnimationFrame(step);
      } else {
        // Hold Completed (3 seconds achieved!)
        triggerConversion();
      }
    };

    holdFrameRef.current = requestAnimationFrame(step);
  }, [isEditing, triggerConversion]);

  // Touch event handlers for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    }
    actionTimerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
    startHold(e);
  };

  const handleTouchMove = (e) => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
    }
    if (!holdStartRef.current) return;
    const touch = e.touches[0];
    if (touch) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      // Cancel if user scrolls or moves finger more than 10px
      if (dx > 10 || dy > 10) {
        cancelHold();
      }
    }
  };

  const handleTouchEnd = () => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
    }
    cancelHold();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions((prev) => !prev);
  };

  // Editing Handlers
  const handleStartEdit = (e) => {
    e?.stopPropagation();
    cancelHold();
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

  const isSubBlock = Boolean(todo.isSubBlock && todo.subBlockId);

  return (
    <div
      ref={rowRef}
      onClick={() => {
        onSelect?.(todo);
        if (isSubBlock && !isEditing) {
          onOpenSubBlock?.(todo.subBlockId);
        }
      }}
      onMouseEnter={() => onSelect?.(todo)}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={() => {
        cancelHold();
        setShowActions(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchEnd}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      role="checkbox"
      aria-checked={Boolean(todo.completed)}
      className={`group relative flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl select-none outline-none transition-all duration-150 overflow-hidden cursor-pointer ${
        isLight
          ? isSubBlock
            ? 'hover:bg-white/40 border border-transparent hover:border-amber-500/20'
            : 'hover:bg-white/40 border border-transparent hover:border-black/10'
          : isSubBlock
            ? 'hover:bg-white/[0.06] border border-transparent hover:border-amber-400/20'
            : 'hover:bg-white/[0.06] border border-transparent hover:border-white/10'
      }`}
    >
      {/* 3-Second Hold-to-Convert Energy Fill Bar */}
      {holdProgress > 0 && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-amber-500/25 via-yellow-400/30 to-amber-500/35 pointer-events-none transition-all duration-75 z-0 border-b-2 border-amber-400"
          style={{ width: `${Math.round(holdProgress * 100)}%` }}
        />
      )}

      {/* Desktop hold-Del delete bar indicator */}
      {deleteProgress > 0 && (
        <div 
          className="absolute inset-y-0 left-0 bg-rose-500/30 pointer-events-none transition-all duration-75 z-0 border-r-2 border-rose-500"
          style={{ width: `${Math.min(100, deleteProgress * 100)}%` }}
        />
      )}

      {/* Checkbox: Independently adapts to local contrast */}
      <div 
        className="relative flex items-center justify-center flex-shrink-0 z-10"
        onClick={(e) => {
          e.stopPropagation();
          cancelHold();
          onToggle?.(todo);
        }}
      >
        <CircularCheckbox
          checked={Boolean(todo.completed)}
          onChange={() => onToggle?.(todo)}
          isLightMode={isLight}
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
            className={`w-full px-3 py-1.5 rounded-xl text-[14.5px] sm:text-[15px] focus:outline-none transition-all border ${
              isLight 
                ? 'bg-white/90 border-black/25 text-[#111111] placeholder-zinc-500 focus:border-black/50 shadow-sm' 
                : 'bg-black/60 border-white/25 text-white placeholder-white/40 focus:border-white/50 shadow-sm'
            }`}
          />
          <button
            type="submit"
            title="Save"
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isLight 
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
              isLight 
                ? 'text-[#111111]/60 hover:bg-black/5 active:bg-black/10' 
                : 'text-white/50 hover:bg-white/10 active:bg-white/15'
            }`}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      ) : (
        <>
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex items-center gap-2 z-10">
            {/* Task Title */}
            <span
              onClick={(e) => {
                if (!isSubBlock) {
                  e.stopPropagation();
                  onToggle?.(todo);
                }
              }}
              onDoubleClick={handleStartEdit}
              className={`text-[14.5px] sm:text-[15.5px] leading-snug tracking-wide transition-colors duration-200 truncate ${
                isLight ? 'text-zinc-950' : 'text-white'
              } ${
                todo.completed
                  ? 'line-through decoration-1 decoration-current'
                  : 'font-medium'
              }`}
              style={{
                textShadow: isLight
                  ? '0 1px 2px rgba(255, 255, 255, 0.85)'
                  : '0 1.5px 8px rgba(0, 0, 0, 0.85)'
              }}
            >
              {todo.title}
            </span>

            {/* Sub-Block Badge if converted */}
            {isSubBlock && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide flex-shrink-0 ${
                isLight
                  ? 'text-amber-700/70'
                  : 'text-amber-400/70'
              }`}>
                <ChevronRight className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Action Icons & Controls — hidden until hover, right-click or long-press */}
          <div 
            className={`flex items-center gap-1 z-10 flex-shrink-0 transition-opacity ${
              showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* If Sub-Block: Show Open Button */}
            {isSubBlock ? (
              <button
                type="button"
                onClick={() => onOpenSubBlock?.(todo.subBlockId)}
                title="Open Sub-Block"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium cursor-pointer transition-all opacity-70 group-hover:opacity-100 ${
                  isLight
                    ? 'text-amber-700 hover:bg-amber-500/10'
                    : 'text-amber-300 hover:bg-amber-400/10'
                }`}
              >
                <span>Open</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              /* Turn into Sub-Block button (1-click alternative to 3s hold) */
              <button
                type="button"
                onClick={() => triggerConversion()}
                title="Turn into Sub-Block (or hold for 3s)"
                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all cursor-pointer active:scale-90 ${
                  isLight 
                    ? 'text-zinc-600 hover:text-amber-600 hover:bg-amber-50' 
                    : 'text-white/60 hover:text-amber-300 hover:bg-white/10'
                }`}
              >
                <Box className="w-3.5 h-3.5 stroke-[2]" />
              </button>
            )}

            {/* Edit Button */}
            <button
              type="button"
              onClick={handleStartEdit}
              title="Edit task"
              className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all cursor-pointer active:scale-90 ${
                isLight 
                  ? 'text-zinc-600 hover:text-black hover:bg-black/5' 
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Pencil className="w-3.5 h-3.5 stroke-[2]" />
            </button>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDelete?.(todo)}
              title="Delete task"
              className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all cursor-pointer active:scale-90 ${
                isLight 
                  ? 'text-zinc-600 hover:text-rose-600 hover:bg-rose-50' 
                  : 'text-white/60 hover:text-rose-400 hover:bg-rose-500/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </>
      )}

      {/* 3s Hold Charging Status Overlay */}
      {isHolding && holdProgress > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/70 text-amber-300 text-[10px] font-mono backdrop-blur-sm">
          {Math.round(holdProgress * 100)}%
        </div>
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
