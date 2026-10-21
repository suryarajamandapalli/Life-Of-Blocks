import React from 'react';
import { Attachment, AccentColor } from '../../types';
import {
  formatFileSize,
  formatRelativeTime,
  getAttachmentIcon,
  ACCENT_CONFIG,
} from '../../utils/formatters';
import {
  Maximize2,
  Download,
  Trash2,
  FileText,
  FileCode,
  Music,
  Video,
  ExternalLink,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface AttachmentCardProps {
  attachment: Attachment;
  accent?: AccentColor;
  onOpenFullscreen: (attachment: Attachment) => void;
  onDownload: (attachment: Attachment) => void;
  onDelete: (attachmentId: string) => void;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({
  attachment,
  accent = 'ice',
  onOpenFullscreen,
  onDownload,
  onDelete,
}) => {
  const accentDetails = ACCENT_CONFIG[accent];
  const IconComponent = getAttachmentIcon(attachment.type);

  const handleCardClick = () => {
    soundService.playTap();
    hapticsService.light();
    onOpenFullscreen(attachment);
  };

  return (
    <div
      onClick={handleCardClick}
      className="liquid-glass group relative rounded-2xl p-4 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Top Specular Inner Rim */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Preview Container */}
      <div className="relative w-full h-36 rounded-xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center mb-3">
        {/* Render Image Thumbnail */}
        {attachment.type === 'image' && attachment.dataUrl ? (
          <img
            src={attachment.dataUrl}
            alt={attachment.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : attachment.type === 'pdf' ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono text-rose-300 uppercase tracking-widest">
              PDF DOCUMENT
            </span>
          </div>
        ) : attachment.type === 'video' ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <Video className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono text-purple-300 uppercase tracking-widest">
              VIDEO PLAYBACK
            </span>
          </div>
        ) : attachment.type === 'audio' ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-widest">
              AUDIO TRACK
            </span>
          </div>
        ) : attachment.type === 'code' ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-md">
              <FileCode className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono text-sky-300 uppercase tracking-widest">
              SOURCE CODE
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 shadow-md">
              <IconComponent className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono text-white/50 uppercase tracking-widest">
              FILE ASSET
            </span>
          </div>
        )}

        {/* Hover Fullscreen Overlay Pill */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 border border-white/30 shadow-lg">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Fullscreen</span>
          </span>
        </div>
      </div>

      {/* File Info */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-white/95 truncate group-hover:text-sky-300 transition-colors" title={attachment.name}>
            {attachment.name}
          </h4>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/[0.08] text-white/60 border border-white/10 flex-shrink-0">
            {attachment.type}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between text-xs text-white/40 font-mono">
          <span>{formatFileSize(attachment.size)}</span>
          <span>{formatRelativeTime(attachment.createdAt)}</span>
        </div>
      </div>

      {/* Action Strip */}
      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            soundService.playTap();
            onOpenFullscreen(attachment);
          }}
          className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundService.playTap();
              hapticsService.light();
              onDownload(attachment);
            }}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              soundService.playDismiss();
              hapticsService.light();
              onDelete(attachment.id);
            }}
            className="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
