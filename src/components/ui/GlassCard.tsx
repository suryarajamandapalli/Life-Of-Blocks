import React from 'react';
import { clsx } from 'clsx';
import { AccentColor } from '../../types';
import { ACCENT_CONFIG } from '../../utils/formatters';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  accent?: AccentColor;
  isInteractive?: boolean;
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  accent,
  isInteractive = false,
  intensity = 'medium',
  className = '',
  glow = false,
  ...props
}) => {
  const accentDetails = accent ? ACCENT_CONFIG[accent] : null;

  return (
    <div
      className={clsx(
        'liquid-glass relative rounded-3xl transition-all duration-300 overflow-hidden',
        isInteractive &&
          'cursor-pointer hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]',
        className
      )}
      style={{
        boxShadow:
          glow && accentDetails
            ? `0 14px 45px -8px ${accentDetails.glow}`
            : undefined,
      }}
      {...props}
    >
      {/* Top Specular Inner Rim Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      {/* Subtle Ambient Accent Corner Glow if accent is provided */}
      {accentDetails && (
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none blur-3xl opacity-30 transition-opacity duration-500"
          style={{ background: accentDetails.primary }}
        />
      )}

      {children}
    </div>
  );
};
