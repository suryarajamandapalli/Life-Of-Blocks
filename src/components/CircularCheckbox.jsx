import React from 'react';
import { Check } from 'lucide-react';

export default function CircularCheckbox({ checked, onChange, disabled, isLightMode = false }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className="relative flex items-center justify-center w-[19px] h-[19px] rounded-full transition-all duration-150 focus:outline-none flex-shrink-0 group cursor-pointer active:scale-90"
      style={{
        background: checked 
          ? (isLightMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)')
          : (isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.35)'),
        border: checked 
          ? (isLightMode ? '1.5px solid rgba(15, 23, 42, 0.95)' : '1.5px solid rgba(255, 255, 255, 0.95)')
          : (isLightMode ? '1.5px solid rgba(0, 0, 0, 0.60)' : '1.5px solid rgba(255, 255, 255, 0.70)'),
        boxShadow: checked
          ? (isLightMode ? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 6px rgba(255,255,255,0.25)')
          : '0 1px 4px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
    >
      {/* Checkmark icon */}
      <span
        className={`flex items-center justify-center transition-all duration-150 transform ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <Check className={`w-3 h-3 stroke-[3.2] ${isLightMode ? 'text-white' : 'text-zinc-950'}`} />
      </span>

      {/* Subtle hover ring when unchecked */}
      {!checked && (
        <span className={`absolute inset-0 rounded-full border transition-all duration-150 ${
          isLightMode 
            ? 'border-black/0 group-hover:border-black/80' 
            : 'border-white/0 group-hover:border-white/90'
        }`} />
      )}
    </button>
  );
}
