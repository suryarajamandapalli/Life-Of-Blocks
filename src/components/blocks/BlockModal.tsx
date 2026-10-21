import React, { useState, useEffect } from 'react';
import { Block, AccentColor } from '../../types';
import {
  AVAILABLE_ACCENTS,
  AVAILABLE_ICONS,
  ACCENT_CONFIG,
  ICON_MAP,
} from '../../utils/formatters';
import { GlassButton } from '../ui/GlassButton';
import { X, Sparkles } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface BlockModalProps {
  isOpen: boolean;
  initialBlock?: Block | null;
  onClose: () => void;
  onSave: (blockData: {
    name: string;
    description: string;
    icon: string;
    accent: AccentColor;
    customWallpaper?: string;
  }) => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  initialBlock,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');
  const [accent, setAccent] = useState<AccentColor>('ice');
  const [customWallpaper, setCustomWallpaper] = useState('');

  useEffect(() => {
    if (initialBlock) {
      setName(initialBlock.name);
      setDescription(initialBlock.description);
      setIcon(initialBlock.icon);
      setAccent(initialBlock.accent);
      setCustomWallpaper(initialBlock.customWallpaper || '');
    } else {
      setName('');
      setDescription('');
      setIcon('GraduationCap');
      setAccent('ice');
      setCustomWallpaper('');
    }
  }, [initialBlock, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    soundService.playTaskComplete();
    hapticsService.medium();

    onSave({
      name: name.trim(),
      description: description.trim(),
      icon,
      accent,
      customWallpaper: customWallpaper.trim() || undefined,
    });
  };

  const selectedAccentConfig = ACCENT_CONFIG[accent];
  const SelectedIcon = ICON_MAP[icon] || ICON_MAP.Layers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={() => {
          soundService.playDismiss();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="liquid-glass relative w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8">
        {/* Specular Rim */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{
                background: selectedAccentConfig.bgSubtle,
                borderColor: selectedAccentConfig.border,
              }}
            >
              <SelectedIcon className="w-5 h-5" style={{ color: selectedAccentConfig.primary }} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {initialBlock ? 'Edit Block' : 'Create New Block'}
              </h2>
              <p className="text-xs text-white/50">
                {initialBlock
                  ? 'Update your life area parameters'
                  : 'Design a dedicated room for this area of your life'}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Block Name */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5 uppercase tracking-wider">
              Block Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GATE 2027, Music Production, Fitness, Coding"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-sky-400 focus:bg-white/[0.1] text-white text-sm outline-none transition-all placeholder:text-white/30"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5 uppercase tracking-wider">
              Description / Vision
            </label>
            <textarea
              rows={2}
              placeholder="What does excellence look like in this space? Goals, roadmap, purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-sky-400 focus:bg-white/[0.1] text-white text-sm outline-none transition-all placeholder:text-white/30 resize-none"
            />
          </div>

          {/* Accent Color Selection */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider">
              Color Accent
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVAILABLE_ACCENTS.map((accKey) => {
                const acc = ACCENT_CONFIG[accKey];
                const isSelected = accent === accKey;
                return (
                  <button
                    key={accKey}
                    type="button"
                    onClick={() => {
                      soundService.playTap();
                      setAccent(accKey);
                    }}
                    className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30 scale-105'
                        : 'border-white/10 hover:border-white/30 hover:scale-100 opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      background: acc.bgSubtle,
                    }}
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

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-2 uppercase tracking-wider">
              Spatial Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
              {AVAILABLE_ICONS.map((iconKey) => {
                const IconItem = ICON_MAP[iconKey];
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => {
                      soundService.playTap();
                      setIcon(iconKey);
                    }}
                    className={`p-2.5 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/20 text-sky-300 ring-2 ring-sky-400/30'
                        : 'border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <IconItem className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Wallpaper */}
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5 uppercase tracking-wider">
              Custom Wallpaper URL <span className="text-white/40 lowercase">(optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... (optional cosmic backdrop)"
              value={customWallpaper}
              onChange={(e) => setCustomWallpaper(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/15 focus:border-sky-400 focus:bg-white/[0.1] text-white text-xs outline-none transition-all placeholder:text-white/30"
            />
          </div>

          {/* Live Preview Pill */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between"
            style={{
              background: selectedAccentConfig.bgSubtle,
              borderColor: selectedAccentConfig.border,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: selectedAccentConfig.primary }}
              >
                <SelectedIcon className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  {name || 'Block Preview'}
                </div>
                <div className="text-xs text-white/60">
                  {description ? description.slice(0, 40) + '...' : 'Ready for tasks & files'}
                </div>
              </div>
            </div>
            <div
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: selectedAccentConfig.glow,
                color: selectedAccentConfig.light,
              }}
            >
              {selectedAccentConfig.name}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <GlassButton variant="ghost" onClick={onClose} type="button">
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              type="submit"
              icon={<Sparkles className="w-4 h-4" />}
              glow
            >
              {initialBlock ? 'Save Changes' : 'Create Block'}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
};
