import React, { useState, useRef } from 'react';
import CircularCheckbox from './CircularCheckbox';

export default function TodoItem({
  todo,
  isSelected,
  deleteProgress = 0,
  onSelect,
  onToggle,
  onOpenContextMenu,
  isLightMode = false
}) {
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const didTriggerMenuRef = useRef(false);

  const HOLD_DURATION = 450; // ms for mobile touch long-press menu

  const startHold = (clientX, clientY) => {
    didTriggerMenuRef.current = false;
    touchStartPosRef.current = { x: clientX, y: clientY };
    startTimeRef.current = Date.now();
    setIsPressing(true);
    setPressProgress(0);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(1, elapsed / HOLD_DURATION);
      setPressProgress(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        didTriggerMenuRef.current = true;
        setIsPressing(false);
        setPressProgress(0);
        onOpenContextMenu(
          { x: clientX, y: clientY },
          todo
        );
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHold = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPressing(false);
    setPressProgress(0);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startHold(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (!isPressing) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      cancelHold();
    }
  };

  const handleTouchEnd = () => {
    cancelHold();
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    onSelect?.(todo);
    if (e.button !== 0) return;
    startHold(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    cancelHold();
  };

  const handleMouseLeave = () => {
    cancelHold();
  };

  // Right click handler
  const handleContextMenu = (e) => {
    e.preventDefault();
    cancelHold();
    onSelect?.(todo);
    onOpenContextMenu({ x: e.clientX, y: e.clientY }, todo);
  };

  const handleRowClick = () => {
    if (didTriggerMenuRef.current) {
      didTriggerMenuRef.current = false;
      return;
    }
    onToggle(todo);
  };

  return (
    <div
      onClick={handleRowClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => onSelect?.(todo)}
      tabIndex={0}
      role="checkbox"
      aria-checked={Boolean(todo.completed)}
      className={`group relative flex items-center gap-3.5 px-[18px] min-h-[52px] sm:min-h-[56px] py-2 cursor-pointer select-none transition-all duration-150 overflow-hidden outline-none ${
        isSelected 
          ? (isLightMode ? 'bg-black/[0.07]' : 'bg-white/[0.06]') 
          : (isLightMode ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.03]')
      } ${todo.completed ? 'opacity-55' : 'opacity-100'}`}
    >
      {/* Long-Press DELETE Key Fill Progress Indicator */}
      {deleteProgress > 0 && (
        <div 
          className="absolute inset-y-0 left-0 bg-rose-500/25 pointer-events-none transition-all duration-75 z-0 border-r border-rose-500/50"
          style={{ width: `${Math.min(100, deleteProgress * 100)}%` }}
        />
      )}

      {/* Checkbox with circular long-press indicator ring */}
      <div className="relative flex items-center justify-center flex-shrink-0 z-10">
        <CircularCheckbox
          checked={Boolean(todo.completed)}
          onChange={() => onToggle(todo)}
          isLightMode={isLightMode}
        />

        {/* Long press context menu indicator ring */}
        {isPressing && (
          <svg
            className="absolute -inset-2 w-8 h-8 pointer-events-none transform -rotate-90"
            viewBox="0 0 32 32"
          >
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke={isLightMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)'}
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke={isLightMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)'}
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 13}
              strokeDashoffset={2 * Math.PI * 13 * (1 - pressProgress)}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {/* Todo title */}
      <span
        className={`flex-1 text-[15px] leading-snug tracking-wide transition-all duration-150 break-words z-10 ${
          todo.completed
            ? (isLightMode ? 'line-through text-zinc-900/40 font-normal' : 'line-through text-white/35 font-normal')
            : (isLightMode ? 'text-zinc-950 font-medium group-hover:text-black' : 'text-white/90 font-normal group-hover:text-white')
        }`}
      >
        {todo.title}
      </span>

      {/* Deleting Indicator Label */}
      {deleteProgress > 0 && (
        <span className="text-[11px] font-mono font-medium text-rose-500 dark:text-rose-300 z-10 flex-shrink-0 animate-pulse">
          Hold Del ({Math.round(deleteProgress * 100)}%)
        </span>
      )}
    </div>
  );
}
