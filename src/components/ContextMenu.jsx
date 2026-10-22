import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function ContextMenu({ position, onEdit, onDelete, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const style = {};
  if (position) {
    const maxX = window.innerWidth - 150;
    const maxY = window.innerHeight - 100;
    style.left = `${Math.min(Math.max(10, position.x), maxX)}px`;
    style.top = `${Math.min(Math.max(10, position.y), maxY)}px`;
  }

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 min-w-[140px] py-1.5 rounded-2xl smoked-modal text-sm text-white/95 shadow-2xl animate-modal-in select-none"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-white/10 text-left transition-colors text-white/85 hover:text-white cursor-pointer"
      >
        <Edit2 className="w-3.5 h-3.5 text-white/60" />
        <span className="font-medium">Edit</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-500/15 text-left transition-colors text-rose-300 hover:text-rose-200 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
        <span className="font-medium">Delete</span>
      </button>
    </div>
  );
}
