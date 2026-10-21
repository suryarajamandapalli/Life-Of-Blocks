import React from 'react';
import { AccentColor } from '../../types';
import { ACCENT_CONFIG } from '../../utils/formatters';

interface LinearProgressProps {
  percentage: number;
  height?: number;
  accent?: AccentColor;
  className?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  percentage,
  height = 6,
  accent = 'ice',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const accentDetails = ACCENT_CONFIG[accent] || ACCENT_CONFIG.ice;

  return (
    <div
      className={`relative w-full rounded-full bg-white/[0.08] overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out relative"
        style={{
          width: `${clamped}%`,
          background: `linear-gradient(90deg, ${accentDetails.primary}, ${accentDetails.light})`,
          boxShadow: `0 0 12px ${accentDetails.glow}`,
        }}
      >
        {/* Subtle moving sheen highlight */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
    </div>
  );
};
