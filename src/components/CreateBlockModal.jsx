import React, { useState, useEffect, useRef } from 'react';

export default function CreateBlockModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreate(name.trim());
      onClose();
    } catch (err) {
      console.error('Failed to create block:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md transition-all duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[340px] sm:max-w-sm p-6 sm:p-7 rounded-[18px] liquid-glass-modal animate-modal-in select-none shadow-2xl mx-auto relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Liquid Top Specular Glaze */}
        <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        <h3 className="text-[17px] font-semibold tracking-wide text-white mb-4 drop-shadow-sm">
          Create Block
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Block name..."
              className="w-full px-4 py-3 rounded-[12px] text-[15px] font-normal text-white placeholder-white/30 liquid-glass-input focus:ring-0"
              maxLength={60}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-[10px] text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-5 py-2 rounded-[10px] text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-30 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}