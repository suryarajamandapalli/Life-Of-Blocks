export interface BlockTask {
  id: string;
  text: string;
  done: boolean;
}

export interface BlockFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  cloudUrl?: string;
  cloudDocId?: string;
}

export interface BlockItem {
  id: string;
  name: string;
  tasks: BlockTask[];
  files: BlockFile[];
  updatedAt?: number;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  blockId: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: number;
  priority?: Priority;
  dueDate?: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export type AttachmentType = 'image' | 'pdf' | 'video' | 'audio' | 'code' | 'text' | 'document' | 'other';

export interface Attachment {
  id: string;
  blockId: string;
  name: string;
  size: number;
  type: AttachmentType;
  mimeType: string;
  dataUrl?: string; // base64 or blob URL
  blob?: Blob;
  createdAt: number;
}

export interface Note {
  id: string;
  blockId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type AccentColor = 'ice' | 'cyan' | 'purple' | 'emerald' | 'crimson' | 'amber' | 'rose' | 'indigo';

export interface Block {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  accent: AccentColor;
  customWallpaper?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type GlassIntensity = 'subtle' | 'medium' | 'strong';
export type AnimationLevel = 'full' | 'reduced' | 'off';

export type ThemeMode = 'dark' | 'dim' | 'light';

export interface AppSettings {
  themeMode?: ThemeMode;
  wallpaper: string; // id or url
  animatedParticles: boolean;
  particleSpeed: number;
  glassIntensity: GlassIntensity;
  animations: AnimationLevel;
  soundEffects: boolean;
  hapticFeedback: boolean;
  defaultAccent: AccentColor;
}

export interface SearchResult {
  id: string;
  type: 'block' | 'task' | 'attachment' | 'note';
  title: string;
  subtitle: string;
  blockId: string;
  blockName: string;
  badge?: string;
  item?: any;
}
