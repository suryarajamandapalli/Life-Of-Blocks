import React from 'react';
import { Layers, Search, Plus, Settings } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface MobileNavBarProps {
  currentView: 'home' | 'workspace';
  onNavigateHome: () => void;
  onOpenSearch: () => void;
  onCreateBlock: () => void;
  onOpenSettings: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentView,
  onNavigateHome,
  onOpenSearch,
  onCreateBlock,
  onOpenSettings,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none">
      <div className="p-3 pointer-events-auto">
        <div className="liquid-glass-pill max-w-md mx-auto p-2 flex items-center justify-around shadow-2xl">
          {/* Home / Blocks */}
          <button
            onClick={() => {
              soundService.playTap();
              hapticsService.light();
              onNavigateHome();
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              currentView === 'home'
                ? 'text-sky-400 bg-sky-500/10'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Blocks</span>
          </button>

          {/* Quick Search */}
          <button
            onClick={() => {
              soundService.playTap();
              hapticsService.light();
              onOpenSearch();
            }}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-white/60 hover:text-white transition-all"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Search</span>
          </button>

          {/* Create Floating Jewel */}
          <button
            onClick={() => {
              soundService.playTap();
              hapticsService.medium();
              onCreateBlock();
            }}
            className="relative -top-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 border border-sky-300/50 flex items-center justify-center text-white shadow-[0_4px_20px_-2px_rgba(56,189,248,0.5)] active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundService.playTap();
              hapticsService.light();
              onOpenSettings();
            }}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-white/60 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
