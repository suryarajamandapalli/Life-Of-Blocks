import React from 'react';
import { clsx } from 'clsx';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  glow?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'glass',
  size = 'md',
  icon,
  children,
  className = '',
  onClick,
  disabled,
  glow = false,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    soundService.playTap();
    hapticsService.light();
    if (onClick) onClick(e);
  };

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-full gap-1.5 font-medium',
    md: 'px-4.5 py-2.5 text-sm rounded-full gap-2 font-medium',
    lg: 'px-6 py-3.5 text-base rounded-full gap-2.5 font-semibold',
    icon: 'p-2.5 rounded-full justify-center items-center',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 text-slate-950 font-bold border border-sky-300/60 shadow-[0_4px_20px_-2px_rgba(56,189,248,0.5)] hover:brightness-110 active:scale-[0.96] transition-all',
    secondary:
      'liquid-glass-pill text-white/90 hover:text-white active:scale-[0.96] transition-all',
    glass:
      'liquid-glass-pill text-white/90 hover:text-white active:scale-[0.96] transition-all',
    ghost:
      'bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white border border-transparent rounded-full active:scale-[0.96] transition-all',
    danger:
      'bg-rose-500/15 text-rose-300 border border-rose-500/40 hover:bg-rose-500/25 hover:border-rose-500/60 active:scale-[0.96] rounded-full transition-all',
  }[variant];

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center select-none cursor-pointer disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden',
        sizeClasses,
        variantClasses,
        glow && 'shadow-[0_0_24px_-2px_rgba(56,189,248,0.5)]',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {/* Top inner specular highlight */}
      {variant !== 'ghost' && (
        <span className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
