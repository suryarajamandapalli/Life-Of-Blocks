import React from 'react';
import { ThemeMode } from '../../types';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface LiquidThemeSwitcherProps {
  currentTheme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  className?: string;
}

export const LiquidThemeSwitcher: React.FC<LiquidThemeSwitcherProps> = ({
  currentTheme = 'dark',
  onChangeTheme,
  className = '',
}) => {
  const options: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dark',
      label: 'Dark Space',
      icon: (
        <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 36 36" fill="currentColor">
          <path d="M12.5 8.473a10.968 10.968 0 0 1 8.785-.97 7.435 7.435 0 0 0-3.737 4.672l-.09.373A7.454 7.454 0 0 0 28.732 20.4a10.97 10.97 0 0 1-5.232 7.125l-.497.27c-5.014 2.566-11.175.916-14.234-3.813l-.295-.483C5.53 18.403 7.13 11.93 12.017 8.77l.483-.297Zm4.234.616a8.946 8.946 0 0 0-2.805.883l-.429.234A9 9 0 0 0 10.206 22.5l.241.395A9 9 0 0 0 22.5 25.794l.416-.255a8.94 8.94 0 0 0 2.167-1.99 9.433 9.433 0 0 1-2.782-.313c-5.043-1.352-8.036-6.535-6.686-11.578l.147-.491c.242-.745.573-1.44.972-2.078Z" />
        </svg>
      ),
    },
    {
      id: 'dim',
      label: 'Cosmic Dim',
      icon: (
        <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 36 36" fill="currentColor">
          <path d="M5 21a1 1 0 0 1 1-1h24a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1ZM12 25a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H13a1 1 0 0 1-1-1ZM15 29a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1ZM18 13a6 6 0 0 1 5.915 7h-2.041A4.005 4.005 0 0 0 18 15a4 4 0 0 0-3.874 5h-2.041A6 6 0 0 1 18 13ZM17 7.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 8.742a1 1 0 1 1 1.618 1.176L24.1 12.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 14.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM6.278 16.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 9.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z" />
        </svg>
      ),
    },
    {
      id: 'light',
      label: 'Frosted Light',
      icon: (
        <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 36 36" fill="currentColor">
          <path fillRule="evenodd" d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" clipRule="evenodd" />
          <path d="M17 6.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 7.742a1 1 0 1 1 1.618 1.176L24.1 11.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 13.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM29.722 20.795a1 1 0 0 1-.619 1.902l-2.853-.927a1 1 0 1 1 .618-1.902l2.854.927ZM25.862 27.159a1 1 0 0 1-1.618 1.175l-1.763-2.427a1 1 0 1 1 1.618-1.175l1.763 2.427ZM19 30.038a1 1 0 0 1-2 0v-3a1 1 0 1 1 2 0v3ZM11.755 28.334a1 1 0 0 1-1.618-1.175l1.764-2.427a1 1 0 1 1 1.618 1.175l-1.764 2.427ZM6.896 22.697a1 1 0 1 1-.618-1.902l2.853-.927a1 1 0 1 1 .618 1.902l-2.853.927ZM6.278 15.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 8.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={`liquid-glass-pill inline-flex items-center p-1 gap-1 relative select-none ${className}`}
      role="radiogroup"
      aria-label="Liquid Glass Theme Switcher"
    >
      {options.map((opt) => {
        const isSelected = currentTheme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              soundService.playTap();
              hapticsService.light();
              onChangeTheme(opt.id);
            }}
            className={`group relative z-10 px-3 py-1.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-300 ${
              isSelected
                ? 'liquid-glass-active text-white'
                : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
            }`}
            title={opt.label}
          >
            {opt.icon}
            <span className="hidden lg:inline text-[11px] font-sans tracking-tight">
              {opt.label.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
