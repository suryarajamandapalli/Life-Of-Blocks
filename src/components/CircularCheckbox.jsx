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
      className="relative flex items-center justify-center w-[19px] h-[19px] rounded-full focus:outline-none flex-shrink-0 group cursor-pointer active:scale-90"
      style={{
        background: checked 
          ? (isLightMode ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.24)')
          : (isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.35)'),
        border: checked 
          ? (isLightMode ? '1.8px solid #059669' : '1.8px solid #34d399')
          : (isLightMode ? '1.5px solid rgba(17, 17, 17, 0.65)' : '1.5px solid rgba(255, 255, 255, 0.75)'),
        boxShadow: checked
          ? 'none'
          : (isLightMode ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 4px rgba(0,0,0,0.5)'),
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease'
      }}
    >
      {/* Green Checkmark icon */}
      <span
        className={`flex items-center justify-center transition-all duration-150 transform ${
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
      >
        <Check className={`w-3.5 h-3.5 stroke-[3.2] ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`} />
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
