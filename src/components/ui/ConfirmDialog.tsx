import React from 'react';
import { GlassButton } from './GlassButton';
import { AlertTriangle, X } from 'lucide-react';
import { soundService } from '../../services/sound';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={() => {
          soundService.playDismiss();
          onCancel();
        }}
      />

      {/* Dialog Card */}
      <div className="liquid-glass relative w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 transition-all duration-300">
        {/* Specular Top Rim */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              isDestructive
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white/95">{title}</h3>
            <p className="mt-1.5 text-sm text-white/60 leading-relaxed">{message}</p>
          </div>

          <button
            onClick={() => {
              soundService.playDismiss();
              onCancel();
            }}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <GlassButton variant="ghost" onClick={onCancel}>
            {cancelText}
          </GlassButton>
          <GlassButton
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={() => {
              soundService.playTap();
              onConfirm();
            }}
          >
            {confirmText}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
