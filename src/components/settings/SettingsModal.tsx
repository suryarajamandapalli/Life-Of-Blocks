import React, { useState } from 'react';
import { AppSettings, GlassIntensity, AnimationLevel, AccentColor } from '../../types';
import { WALLPAPER_PRESETS } from '../layout/CosmicBackground';
import { AVAILABLE_ACCENTS, ACCENT_CONFIG } from '../../utils/formatters';
import { GlassButton } from '../ui/GlassButton';
import { LiquidThemeSwitcher } from '../ui/LiquidThemeSwitcher';
import {
  X,
  Palette,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Volume2,
  Vibrate,
  Shield,
  Layers,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onExportData,
  onImportData,
  onClearData,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'effects' | 'data' | 'about'>('appearance');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => {
          soundService.playDismiss();
          onClose();
        }}
      />

      {/* Settings Modal Card */}
      <div className="liquid-glass relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 flex flex-col max-h-[90vh]">
        {/* Specular Inner Rim */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">System Settings</h2>
              <p className="text-xs text-white/50">Personalize your spatial operating environment</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playDismiss();
              onClose();
            }}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 mb-6 border-b border-white/10 pb-3 overflow-x-auto">
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'effects', label: 'Audio & Motion', icon: Sparkles },
            { id: 'data', label: 'Data & Storage', icon: Download },
            { id: 'about', label: 'About', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundService.playTap();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-glass-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* iOS 26 Liquid Glass Theme Mode */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Liquid Glass Theme Mode</h4>
                  <p className="text-xs text-white/50">
                    Switch between Dark Space, Cosmic Dim, and Frosted Light refraction
                  </p>
                </div>
                <LiquidThemeSwitcher
                  currentTheme={settings.themeMode || 'dark'}
                  onChangeTheme={(mode) => onUpdateSettings({ themeMode: mode })}
                />
              </div>

              {/* Cosmic Wallpaper Selector */}
              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">
                  Cosmic Environment Wallpaper
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(WALLPAPER_PRESETS).map(([key, preset]) => {
                    const isSelected = settings.wallpaper === key;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          soundService.playTap();
                          hapticsService.light();
                          onUpdateSettings({ wallpaper: key });
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-400 ring-2 ring-sky-400/30 shadow-glass-sm'
                            : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">{preset.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                        </div>
                        <p className="text-xs text-white/50 mt-1">{preset.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Glass Intensity */}
              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Glass Translucency & Blur
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['subtle', 'medium', 'strong'] as GlassIntensity[]).map((level) => {
                    const isSelected = settings.glassIntensity === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          soundService.playTap();
                          onUpdateSettings({ glassIntensity: level });
                        }}
                        className={`py-3 rounded-2xl border capitalize text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-glass-sm'
                            : 'bg-white/[0.04] text-white/60 hover:text-white border-white/10'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Default Color Accent
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVAILABLE_ACCENTS.map((accKey) => {
                    const acc = ACCENT_CONFIG[accKey];
                    const isSelected = settings.defaultAccent === accKey;
                    return (
                      <button
                        key={accKey}
                        type="button"
                        onClick={() => {
                          soundService.playTap();
                          onUpdateSettings({ defaultAccent: accKey });
                        }}
                        className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'border-white ring-2 ring-white/30 scale-105'
                            : 'border-white/10 hover:border-white/30 hover:scale-100 opacity-70 hover:opacity-100'
                        }`}
                        style={{ background: acc.bgSubtle }}
                        title={acc.name}
                      >
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{
                            background: acc.primary,
                            boxShadow: isSelected ? `0 0 10px ${acc.glow}` : undefined,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* EFFECTS TAB */}
          {activeTab === 'effects' && (
            <div className="space-y-5">
              {/* Animated Starfield Particles */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div>
                  <div className="text-sm font-semibold text-white">Stardust Particles</div>
                  <div className="text-xs text-white/50">
                    Live dynamic cosmic starfield drifting in the background
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundService.playTap();
                    onUpdateSettings({ animatedParticles: !settings.animatedParticles });
                  }}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                    settings.animatedParticles ? 'bg-sky-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.animatedParticles ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sky-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Spatial Sound Design</div>
                    <div className="text-xs text-white/50">
                      Subtle synthesized micro-audio feedback on taps and completions
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    soundService.setEnabled(!settings.soundEffects);
                    onUpdateSettings({ soundEffects: !settings.soundEffects });
                  }}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                    settings.soundEffects ? 'bg-sky-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Haptic Feedback */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-purple-400">
                    <Vibrate className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Haptic Feedback</div>
                    <div className="text-xs text-white/50">
                      Tactile vibrational response on mobile and Android devices
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    hapticsService.setEnabled(!settings.hapticFeedback);
                    onUpdateSettings({ hapticFeedback: !settings.hapticFeedback });
                  }}
                  className={`w-12 h-7 rounded-full transition-colors relative p-1 ${
                    settings.hapticFeedback ? 'bg-sky-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Animations Level */}
              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                  Motion & Physics
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['full', 'reduced', 'off'] as AnimationLevel[]).map((level) => {
                    const isSelected = settings.animations === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => {
                          soundService.playTap();
                          onUpdateSettings({ animations: level });
                        }}
                        className={`py-3 rounded-2xl border capitalize text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-glass-sm'
                            : 'bg-white/[0.04] text-white/60 hover:text-white border-white/10'
                        }`}
                      >
                        {level} Motion
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* DATA TAB */}
          {activeTab === 'data' && (
            <div className="space-y-5">
              {/* Storage Overview */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Local-First Storage Engine</h4>
                    <p className="text-xs text-white/50">
                      Your data is 100% private and stored in client-side IndexedDB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export JSON */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Export Complete Backup</h4>
                  <p className="text-xs text-white/50">
                    Download all your blocks, tasks, notes, and file attachments as a JSON archive.
                  </p>
                </div>
                <GlassButton
                  variant="primary"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  onClick={onExportData}
                >
                  Export JSON
                </GlassButton>
              </div>

              {/* Import JSON */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Restore from Backup</h4>
                  <p className="text-xs text-white/50">
                    Upload a previously exported Life of Blocks JSON archive.
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    icon={<Upload className="w-4 h-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Import JSON
                  </GlassButton>
                </div>
              </div>

              {/* Clear All Data */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-rose-300">Clear All Stored Data</h4>
                  <p className="text-xs text-rose-200/50">
                    Irrevocably deletes all blocks, tasks, files, and notes from this device.
                  </p>
                </div>
                <GlassButton
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setShowClearConfirm(true)}
                >
                  Clear Data
                </GlassButton>
              </div>

              {showClearConfirm && (
                <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 animate-fade-in">
                  <div className="flex items-center gap-2 text-rose-300 text-sm font-semibold mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Are you absolutely sure?</span>
                  </div>
                  <p className="text-xs text-white/70 mb-4">
                    This action will reset Life of Blocks to its initial seeded state. All your custom
                    blocks and attached files will be erased.
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setShowClearConfirm(false);
                        onClearData();
                      }}
                    >
                      Yes, Clear Everything
                    </GlassButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 to-indigo-600 border border-sky-300/40 mx-auto flex items-center justify-center text-white shadow-[0_0_35px_-5px_rgba(56,189,248,0.5)]">
                <Layers className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">LIFE OF BLOCKS</h3>
                <p className="text-sm text-sky-400 font-medium mt-0.5">Version 1.0.0 (Spatial Release)</p>
                <p className="text-xs text-white/50 italic mt-1 font-serif">&ldquo;Your life. In blocks.&rdquo;</p>
              </div>

              <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                Life of Blocks is built around the philosophy that life is best lived and achieved by
                organizing priorities into focused visual workspaces rather than an endless generic list.
              </p>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between text-white/70">
                  <span>Architecture</span>
                  <span className="font-mono text-white">React 18 + TypeScript + Vite</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Native Mobile Wrapper</span>
                  <span className="font-mono text-white">Capacitor 6 Android</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Storage Backend</span>
                  <span className="font-mono text-white">IndexedDB (Offline-First)</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Privacy & Tracking</span>
                  <span className="font-mono text-emerald-400">0% External Tracking</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end">
          <GlassButton variant="primary" size="sm" onClick={onClose}>
            Done
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
