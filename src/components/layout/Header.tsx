import React from 'react';
import { Search, Plus, Settings, Layers } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';
import { LiquidThemeSwitcher } from '../ui/LiquidThemeSwitcher';
import { ThemeMode } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onCreateBlock: () => void;
  blockCount: number;
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenSettings,
  onCreateBlock,
  blockCount,
  themeMode = 'dark',
  onChangeTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="liquid-glass-pill flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400/25 via-sky-600/10 to-transparent border border-sky-400/40 flex items-center justify-center shadow-[0_0_20px_-3px_rgba(56,189,248,0.5)]">
              <Layers className="w-5 h-5 text-sky-400" />
              <div className="absolute inset-0 rounded-2xl bg-sky-400/10 animate-pulse-slow" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  LIFE OF BLOCKS
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono tracking-wide rounded-full bg-white/[0.08] text-white/70 border border-white/10">
                  {blockCount} {blockCount === 1 ? 'Block' : 'Blocks'}
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-white/50 tracking-wide font-light">
                Your life. In blocks.
              </p>
            </div>
          </div>

          {/* Quick Search Bar, iOS 26 Theme Switcher & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="liquid-glass flex items-center gap-2 px-3 py-1.5 rounded-full text-white/70 hover:text-white transition-all text-xs cursor-pointer group"
              title="Search everything (Ctrl+K or ⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-white/50 group-hover:text-sky-400 transition-colors" />
              <span className="hidden sm:inline font-medium">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/50 bg-white/10 rounded-md border border-white/10">
                ⌘K
              </kbd>
            </button>

            {/* iOS 26 Liquid Theme Switcher */}
            {onChangeTheme && (
              <div className="hidden sm:block">
                <LiquidThemeSwitcher
                  currentTheme={themeMode}
                  onChangeTheme={onChangeTheme}
                />
              </div>
            )}

            {/* Create Block Action */}
            <GlassButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={onCreateBlock}
            >
              <span className="hidden xs:inline">New Block</span>
            </GlassButton>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
