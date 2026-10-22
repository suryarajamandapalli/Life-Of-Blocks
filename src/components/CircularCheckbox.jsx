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
      className="relative flex items-center justify-center w-[18px] h-[18px] rounded-full transition-all duration-150 focus:outline-none flex-shrink-0 group cursor-pointer"
      style={{
        background: checked 
          ? (isLightMode ? 'rgba(0, 0, 0, 0.90)' : 'rgba(255, 255, 255, 0.95)')
          : (isLightMode ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.04)'),
        border: checked 
          ? (isLightMode ? '1.5px solid rgba(0, 0, 0, 0.90)' : '1.5px solid rgba(255, 255, 255, 0.95)')
          : (isLightMode ? '1.5px solid rgba(0, 0, 0, 0.38)' : '1.5px solid rgba(255, 255, 255, 0.28)'),
      }}
    >
      {/* Checkmark icon */}
      <span
        className={`flex items-center justify-center transition-all duration-150 transform ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <Check className={`w-3 h-3 stroke-[3.2] ${isLightMode ? 'text-white' : 'text-black'}`} />
      </span>

      {/* Subtle hover ring when unchecked */}
      {!checked && (
        <span className={`absolute inset-0 rounded-full border transition-all duration-150 ${
          isLightMode 
            ? 'border-black/0 group-hover:border-black/50' 
            : 'border-white/0 group-hover:border-white/40'
        }`} />
      )}
    </button>
  );
}
