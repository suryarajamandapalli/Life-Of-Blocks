import React from 'react';
import {
  GraduationCap,
  Headphones,
  Code2,
  Flame,
  Briefcase,
  FolderKanban,
  Heart,
  Plane,
  Sparkles,
  BookOpen,
  DollarSign,
  Palette,
  Layers,
  Activity,
  Compass,
  Coffee,
  Globe,
  Shield,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  File,
} from 'lucide-react';
import { AccentColor, AttachmentType } from '../types';

export const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  Headphones,
  Code2,
  Flame,
  Briefcase,
  FolderKanban,
  Heart,
  Plane,
  Sparkles,
  BookOpen,
  DollarSign,
  Palette,
  Layers,
  Activity,
  Compass,
  Coffee,
  Globe,
  Shield,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const ACCENT_CONFIG: Record<
  AccentColor,
  {
    name: string;
    primary: string;
    light: string;
    glow: string;
    border: string;
    borderHover: string;
    bgSubtle: string;
    gradient: string;
    text: string;
    badgeBg: string;
  }
> = {
  ice: {
    name: 'Ice Blue',
    primary: '#38bdf8',
    light: '#7dd3fc',
    glow: 'rgba(56, 189, 248, 0.45)',
    border: 'rgba(56, 189, 248, 0.28)',
    borderHover: 'rgba(56, 189, 248, 0.65)',
    bgSubtle: 'rgba(56, 189, 248, 0.08)',
    gradient: 'from-sky-400 to-blue-600',
    text: 'text-sky-400',
    badgeBg: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  },
  cyan: {
    name: 'Cosmic Cyan',
    primary: '#06b6d4',
    light: '#67e8f9',
    glow: 'rgba(6, 182, 212, 0.45)',
    border: 'rgba(6, 182, 212, 0.28)',
    borderHover: 'rgba(6, 182, 212, 0.65)',
    bgSubtle: 'rgba(6, 182, 212, 0.08)',
    gradient: 'from-cyan-400 to-teal-600',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30',
  },
  purple: {
    name: 'Nebula Violet',
    primary: '#a855f7',
    light: '#d8b4fe',
    glow: 'rgba(168, 85, 247, 0.45)',
    border: 'rgba(168, 85, 247, 0.28)',
    borderHover: 'rgba(168, 85, 247, 0.65)',
    bgSubtle: 'rgba(168, 85, 247, 0.08)',
    gradient: 'from-purple-400 to-indigo-600',
    text: 'text-purple-400',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
  },
  emerald: {
    name: 'Aurora Emerald',
    primary: '#10b981',
    light: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.45)',
    border: 'rgba(16, 185, 129, 0.28)',
    borderHover: 'rgba(16, 185, 129, 0.65)',
    bgSubtle: 'rgba(16, 185, 129, 0.08)',
    gradient: 'from-emerald-400 to-teal-600',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  },
  crimson: {
    name: 'Supernova Crimson',
    primary: '#f43f5e',
    light: '#fda4af',
    glow: 'rgba(244, 63, 94, 0.45)',
    border: 'rgba(244, 63, 94, 0.28)',
    borderHover: 'rgba(244, 63, 94, 0.65)',
    bgSubtle: 'rgba(244, 63, 94, 0.08)',
    gradient: 'from-rose-500 to-red-600',
    text: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  },
  amber: {
    name: 'Solar Amber',
    primary: '#f59e0b',
    light: '#fcd34d',
    glow: 'rgba(245, 158, 11, 0.45)',
    border: 'rgba(245, 158, 11, 0.28)',
    borderHover: 'rgba(245, 158, 11, 0.65)',
    bgSubtle: 'rgba(245, 158, 11, 0.08)',
    gradient: 'from-amber-400 to-orange-600',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  },
  rose: {
    name: 'Stardust Pink',
    primary: '#ec4899',
    light: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.45)',
    border: 'rgba(236, 72, 153, 0.28)',
    borderHover: 'rgba(236, 72, 153, 0.65)',
    bgSubtle: 'rgba(236, 72, 153, 0.08)',
    gradient: 'from-pink-400 to-rose-600',
    text: 'text-pink-400',
    badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-400/30',
  },
  indigo: {
    name: 'Deep Cosmos',
    primary: '#6366f1',
    light: '#a5b4fc',
    glow: 'rgba(99, 102, 241, 0.45)',
    border: 'rgba(99, 102, 241, 0.28)',
    borderHover: 'rgba(99, 102, 241, 0.65)',
    bgSubtle: 'rgba(99, 102, 241, 0.08)',
    gradient: 'from-indigo-400 to-blue-700',
    text: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  },
};

export const AVAILABLE_ACCENTS: AccentColor[] = [
  'ice',
  'cyan',
  'purple',
  'emerald',
  'crimson',
  'amber',
  'rose',
  'indigo',
];

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const getAttachmentIcon = (type: AttachmentType): React.ElementType => {
  switch (type) {
    case 'image':
      return FileImage;
    case 'pdf':
      return FileText;
    case 'video':
      return FileVideo;
    case 'audio':
      return FileAudio;
    case 'code':
      return FileCode;
    case 'text':
      return FileText;
    default:
      return File;
  }
};
