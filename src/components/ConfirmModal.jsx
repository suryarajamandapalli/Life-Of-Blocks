import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = "Delete this item?",
  onClose,
  onConfirm,
  confirmLabel = "Delete",
  isDanger = true
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (e.key === 'Enter' && isOpen) {
        onConfirm();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md transition-all duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[300px] sm:max-w-xs p-6 rounded-[18px] liquid-glass-modal animate-modal-in text-center select-none shadow-2xl mx-auto relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Liquid Top Specular Glaze */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <p className="text-[15px] font-normal tracking-wide text-white/95 mb-6">
          {title}
        </p>

        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-[10px] text-sm font-semibold transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 ${
              isDanger
                ? 'bg-rose-500/90 text-white hover:bg-rose-500'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}