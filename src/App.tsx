import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { User } from 'firebase/auth';
import { soundService } from './services/sound';
import { hapticsService } from './services/haptics';
import {
  subscribeAuthState,
  syncBlocksToFirestore,
  subscribeBlocksFromFirestore,
  handleRedirectResult,
} from './services/firebase';
import { AppLauncherModal, WebAppItem, DEFAULT_WEB_APPS } from './components/apps/AppLauncherModal';
import { WallpaperModal, WALLPAPERS } from './components/wallpaper/WallpaperModal';
import { AuthModal } from './components/auth/AuthModal';
import { BlockItem, BlockTask, BlockFile } from './types';

export type ThemeMode = 'light' | 'dark';

const DEFAULT_BLOCKS: BlockItem[] = [
  {
    id: 'block-gate-2027',
    name: 'GATE 2027',
    tasks: [
      { id: 't1', text: 'Linear Algebra revision & formulas', done: true },
      { id: 't2', text: 'Calculus practice test #3', done: true },
      { id: 't3', text: 'Digital Logic and Boolean algebra', done: false },
      { id: 't4', text: 'Algorithms & Data Structures PYQs', done: false },
    ],
    files: []
  },
  {
    id: 'block-music',
    name: 'Music',
    tasks: [
      { id: 't5', text: 'Piano chord inversions practice', done: true },
      { id: 't6', text: 'Record vocal melodies for new track', done: false },
      { id: 't7', text: 'Sound design for bassline', done: true },
    ],
    files: []
  },
  {
    id: 'block-projects',
    name: 'Projects',
    tasks: [
      { id: 't8', text: 'Design Life of Blocks UI & spatial glass', done: true },
      { id: 't9', text: 'Build responsive components & viewer', done: true },
      { id: 't10', text: 'Compile production Android APK', done: false },
    ],
    files: []
  }
];

const uid = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
};

const guessMime = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/plain',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml'
  };
  return map[ext] || 'application/octet-stream';
};

const extOf = (f: BlockFile): string => {
  return (f.name.split('.').pop() || 'FILE').toUpperCase();
};

const kindOf = (f: BlockFile): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'file' => {
  const type = (f.type || '').toLowerCase();
  const ext = (f.name.split('.').pop() || '').toLowerCase();

  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (type.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  if (type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) return 'audio';
  if (type.startsWith('text/') || ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'sql'].includes(ext)) return 'text';
  return 'file';
};

export const App: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockItem[]>(() => {
    try {
      const saved = localStorage.getItem('lifeOfBlocks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read existing blocks, starting fresh', e);
    }
    return DEFAULT_BLOCKS;
  });

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Theme state: dark, light
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const savedTheme = localStorage.getItem('lifeOfBlocksTheme') as ThemeMode;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {}
    return 'dark';
  });

  // 4K Wallpaper state: random on load or user chosen
  const [wallpaperIndex, setWallpaperIndex] = useState<number>(() => {
    try {
      const savedIndex = localStorage.getItem('lifeOfBlocksWallpaperIdx');
      if (savedIndex !== null) {
        const idx = (parseInt(savedIndex, 10) + 1) % WALLPAPERS.length; // Change on each load/refresh!
        return isNaN(idx) ? Math.floor(Math.random() * WALLPAPERS.length) : idx;
      }
    } catch {}
    return Math.floor(Math.random() * WALLPAPERS.length);
  });

  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false);

  // App Launcher state
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [apps, setApps] = useState<WebAppItem[]>(() => {
    try {
      const saved = localStorage.getItem('lifeOfBlocksApps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WEB_APPS;
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [blockNameInput, setBlockNameInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [viewerFile, setViewerFile] = useState<BlockFile | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);

  // Firebase Auth state & Onboarding
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInitialAuthChecked, setIsInitialAuthChecked] = useState(false);

  const blockInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase Auth state subscription & mobile redirect listener
  useEffect(() => {
    handleRedirectResult().catch((err) => console.error('Redirect sign-in check:', err));

    const unsubscribe = subscribeAuthState((user) => {
      setCurrentUser(user);
      setIsInitialAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // First-time onboarding trigger (presents Google sign-in modal gently on first arrival)
  useEffect(() => {
    if (isInitialAuthChecked && !currentUser) {
      const hasSeen = localStorage.getItem('lifeOfBlocksSeenOnboarding');
      if (!hasSeen) {
        setIsAuthModalOpen(true);
        localStorage.setItem('lifeOfBlocksSeenOnboarding', 'true');
      }
    }
  }, [isInitialAuthChecked, currentUser]);

  // Cloud Firestore Realtime synchronization for blocks
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeBlocksFromFirestore(currentUser.uid, (remoteBlocks) => {
      if (remoteBlocks && Array.isArray(remoteBlocks) && remoteBlocks.length > 0) {
        setBlocks(remoteBlocks);
      } else {
        // New user or empty cloud document: push current local blocks
        syncBlocksToFirestore(currentUser.uid, blocks);
      }
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Debounced auto-save to Firestore when blocks change
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      syncBlocksToFirestore(currentUser.uid, blocks);
    }, 700);
    return () => clearTimeout(timer);
  }, [blocks, currentUser]);

  // Sync blocks to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lifeOfBlocks', JSON.stringify(blocks));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [blocks]);

  // Sync apps to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lifeOfBlocksApps', JSON.stringify(apps));
    } catch (e) {
      console.warn('Apps localStorage save error:', e);
    }
  }, [apps]);

  // Sync theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lifeOfBlocksTheme', theme);
    } catch {}
  }, [theme]);

  // Sync wallpaper
  useEffect(() => {
    try {
      localStorage.setItem('lifeOfBlocksWallpaperIdx', wallpaperIndex.toString());
    } catch {}
  }, [wallpaperIndex]);

  // Cycle wallpaper on demand
  const cycleWallpaper = () => {
    soundService.playWallpaper();
    hapticsService.light();
    setWallpaperLoaded(false);
    setWallpaperIndex(prev => (prev + 1) % WALLPAPERS.length);
  };

  // Soothing Zen & Minecraft ambient music / chimes
  useEffect(() => {
    soundService.startZenAmbience();
    return () => {
      soundService.stopZenAmbience();
    };
  }, []);

  // Android hardware back button handler
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => {
      if (viewerFile) {
        closeViewer();
      } else if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
      } else if (isWallpaperModalOpen) {
        setIsWallpaperModalOpen(false);
      } else if (isAppLauncherOpen) {
        setIsAppLauncherOpen(false);
      } else if (isCreateOpen) {
        closeCreate();
      } else if (activeBlockId) {
        closeWorkspace();
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then(handle => handle.remove()).catch(() => {});
    };
  }, [viewerFile, isAuthModalOpen, isWallpaperModalOpen, isAppLauncherOpen, isCreateOpen, activeBlockId]);

  // Cleanup active blob URL on change/unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [activeBlobUrl]);

  // Modals & Navigation
  const openCreate = () => {
    soundService.playOpen();
    hapticsService.light();
    setIsCreateOpen(true);
    setBlockNameInput('');
    setTimeout(() => blockInputRef.current?.focus(), 80);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setBlockNameInput('');
  };

  const createBlock = (customName?: string | React.MouseEvent) => {
    const raw = (typeof customName === 'string' ? customName : blockNameInput).trim();
    const nameToUse = raw || `New Block ${blocks.length + 1}`;
    soundService.playWoodPop();
    hapticsService.medium();
    const newBlock: BlockItem = {
      id: uid(),
      name: nameToUse,
      tasks: [],
      files: []
    };
    setBlocks(prev => [...prev, newBlock]);
    closeCreate();
  };

  const deleteBlock = (id: string, name: string) => {
    soundService.playTap();
    hapticsService.light();
    if (confirm(`Delete "${name}"?`)) {
      soundService.playDismiss();
      hapticsService.medium();
      setBlocks(prev => prev.filter(b => b.id !== id));
      if (activeBlockId === id) {
        setActiveBlockId(null);
      }
    }
  };

  const openWorkspace = (id: string) => {
    soundService.playEnterBlock();
    hapticsService.light();
    setActiveBlockId(id);
    setTaskInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeWorkspace = () => {
    soundService.playTap();
    hapticsService.light();
    closeViewer();
    setActiveBlockId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global keyboard shortcuts:
  // - Escape: dismiss overlay / close workspace
  // - Right Shift: open / toggle Apps & Shortcuts launcher
  // - Right Alt: add new block (triggers Create Block)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore repeat events from holding down keys
      if (e.repeat) return;

      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable);

      // Escape -> close topmost open overlay/viewer/modal
      if (e.key === 'Escape') {
        if (viewerFile) {
          closeViewer();
        } else if (isWallpaperModalOpen) {
          setIsWallpaperModalOpen(false);
        } else if (isAppLauncherOpen) {
          setIsAppLauncherOpen(false);
        } else if (isCreateOpen) {
          closeCreate();
        } else if (activeBlockId) {
          closeWorkspace();
        }
        return;
      }

      // Right Shift -> Open Apps & Shortcuts Launcher
      const isRightShift =
        e.code === 'ShiftRight' ||
        (e.key === 'Shift' && e.location === 2);

      if (isRightShift) {
        // If typing inside an input/textarea, let Shift capitalize characters normally
        if (isTyping) return;

        e.preventDefault();
        soundService.playTap();
        hapticsService.light();

        if (viewerFile) closeViewer();
        if (isWallpaperModalOpen) setIsWallpaperModalOpen(false);
        if (isCreateOpen) closeCreate();

        setIsAppLauncherOpen(prev => !prev);
        return;
      }

      // Right Alt -> Add New Block
      const isRightAlt =
        e.code === 'AltRight' ||
        (e.key === 'Alt' && e.location === 2) ||
        e.key === 'AltGraph';

      if (isRightAlt) {
        e.preventDefault();

        // If the Create modal is already open, commit and add block
        if (isCreateOpen) {
          createBlock();
          return;
        }

        // Close other overlays and open Create Block
        if (viewerFile) closeViewer();
        if (isWallpaperModalOpen) setIsWallpaperModalOpen(false);
        if (isAppLauncherOpen) setIsAppLauncherOpen(false);
        if (activeBlockId) setActiveBlockId(null);

        openCreate();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewerFile,
    isWallpaperModalOpen,
    isAppLauncherOpen,
    isCreateOpen,
    activeBlockId,
    blockNameInput,
    blocks.length
  ]);

  // Task actions
  const addTask = () => {
    const val = taskInput.trim();
    if (!val || !activeBlockId) return;
    soundService.playWoodPop();
    hapticsService.light();
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== activeBlockId) return b;
        return {
          ...b,
          tasks: [...b.tasks, { id: uid(), text: val, done: false }]
        };
      })
    );
    setTaskInput('');
    taskInputRef.current?.focus();
  };

  const toggleTask = (taskId: string, currentDone: boolean) => {
    if (!currentDone) {
      soundService.playTaskComplete();
      hapticsService.success();
    } else {
      soundService.playTap(0.75);
      hapticsService.light();
    }
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== activeBlockId) return b;
        return {
          ...b,
          tasks: b.tasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t))
        };
      })
    );
  };

  const removeTask = (taskId: string) => {
    soundService.playDismiss();
    hapticsService.light();
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== activeBlockId) return b;
        return {
          ...b,
          tasks: b.tasks.filter(t => t.id !== taskId)
        };
      })
    );
  };

  // File handling
  const handleFiles = (files: FileList | null) => {
    if (!files || !activeBlockId) return;
    soundService.playTap();
    hapticsService.medium();

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as string;
        const newFile: BlockFile = {
          id: uid(),
          name: file.name,
          type: file.type || guessMime(file.name),
          size: file.size,
          data: fileData
        };

        setBlocks(prev =>
          prev.map(b => {
            if (b.id !== activeBlockId) return b;
            return {
              ...b,
              files: [...(b.files || []), newFile]
            };
          })
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (fileId: string) => {
    soundService.playDismiss();
    hapticsService.light();
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== activeBlockId) return b;
        return {
          ...b,
          files: (b.files || []).filter(f => f.id !== fileId)
        };
      })
    );
    if (viewerFile?.id === fileId) {
      closeViewer();
    }
  };

  const fileToBlobUrl = (f: BlockFile): string => {
    if (!f.data) return '';
    try {
      if (f.data.startsWith('data:')) {
        const parts = f.data.split(',');
        const mime = f.type || parts[0].match(/data:(.*?);/)?.[1] || 'application/octet-stream';
        const binary = atob(parts[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
        const url = URL.createObjectURL(blob);
        setActiveBlobUrl(url);
        return url;
      }
      return f.data;
    } catch {
      return f.data;
    }
  };

  const openViewer = (f: BlockFile) => {
    soundService.playTap();
    hapticsService.light();
    fileToBlobUrl(f);
    setViewerFile(f);
    document.body.style.overflow = 'hidden';
  };

  const closeViewer = () => {
    setViewerFile(null);
    document.body.style.overflow = '';
    if (activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
      setActiveBlobUrl(null);
    }
  };

  // Reusable Header Action Group (Apps Icon, Wallpaper Cycle, Theme Switcher)
  const renderNavActions = () => (
    <div className="nav-actions">
      {/* 9-DOT APP GRID LAUNCHER */}
      <button
        type="button"
        className="icon-nav-btn"
        onClick={() => {
          soundService.playOpen();
          hapticsService.light();
          setIsAppLauncherOpen(true);
        }}
        aria-label="Apps & Shortcuts Drawer"
        title="Apps & Shortcuts"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="5" r="2.2" />
          <circle cx="12" cy="5" r="2.2" />
          <circle cx="19" cy="5" r="2.2" />
          <circle cx="5" cy="12" r="2.2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="19" cy="12" r="2.2" />
          <circle cx="5" cy="19" r="2.2" />
          <circle cx="12" cy="19" r="2.2" />
          <circle cx="19" cy="19" r="2.2" />
        </svg>
      </button>

      {/* 4K WALLPAPER CHANGER BUTTON */}
      <button
        type="button"
        className="icon-nav-btn"
        onClick={() => {
          soundService.playOpen();
          hapticsService.light();
          setIsWallpaperModalOpen(true);
        }}
        aria-label="4K Space & Nature Wallpapers"
        title={`Wallpaper: ${currentWallpaper.title}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </button>

      {/* LIQUID GLASS THEME SWITCHER (2 MODES: LIGHT & DARK) */}
      <div
        className="switcher-capsule"
        data-active={theme}
        role="radiogroup"
        aria-label="Liquid Glass Theme"
      >
        <div className="switcher-indicator" />

        <button
          type="button"
          className={`switcher-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => {
            soundService.playTheme('light');
            hapticsService.light();
            setTheme('light');
          }}
          aria-label="Light Glass Theme"
          title="Light Glass"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36">
            <path fill="currentColor" fillRule="evenodd" d="M18 12a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" clipRule="evenodd" />
            <path fill="currentColor" d="M17 6.038a1 1 0 1 1 2 0v3a1 1 0 0 1-2 0v-3ZM24.244 7.742a1 1 0 1 1 1.618 1.176L24.1 11.345a1 1 0 1 1-1.618-1.176l1.763-2.427ZM29.104 13.379a1 1 0 0 1 .618 1.902l-2.854.927a1 1 0 1 1-.618-1.902l2.854-.927ZM29.722 20.795a1 1 0 0 1-.619 1.902l-2.853-.927a1 1 0 1 1 .618-1.902l2.854.927ZM25.862 27.159a1 1 0 0 1-1.618 1.175l-1.763-2.427a1 1 0 1 1 1.618-1.175l1.763 2.427ZM19 30.038a1 1 0 0 1-2 0v-3a1 1 0 1 1 2 0v3ZM11.755 28.334a1 1 0 0 1-1.618-1.175l1.764-2.427a1 1 0 1 1 1.618 1.175l-1.764 2.427ZM6.896 22.697a1 1 0 1 1-.618-1.902l2.853-.927a1 1 0 1 1 .618 1.902l-2.853.927ZM6.278 15.28a1 1 0 1 1 .618-1.901l2.853.927a1 1 0 1 1-.618 1.902l-2.853-.927ZM10.137 8.918a1 1 0 0 1 1.618-1.176l1.764 2.427a1 1 0 0 1-1.618 1.176l-1.764-2.427Z" />
          </svg>
        </button>

        <button
          type="button"
          className={`switcher-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => {
            soundService.playTheme('dark');
            hapticsService.light();
            setTheme('dark');
          }}
          aria-label="Dark Space Glass Theme"
          title="Dark Space Glass"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36">
            <path fill="currentColor" d="M12.5 8.473a10.968 10.968 0 0 1 8.785-.97 7.435 7.435 0 0 0-3.737 4.672l-.09.373A7.454 7.454 0 0 0 28.732 20.4a10.97 10.97 0 0 1-5.232 7.125l-.497.27c-5.014 2.566-11.175.916-14.234-3.813l-.295-.483C5.53 18.403 7.13 11.93 12.017 8.77l.483-.297Zm4.234.616a8.946 8.946 0 0 0-2.805.883l-.429.234A9 9 0 0 0 10.206 22.5l.241.395A9 9 0 0 0 22.5 25.794l.416-.255a8.94 8.94 0 0 0 2.167-1.99 9.433 9.433 0 0 1-2.782-.313c-5.043-1.352-8.036-6.535-6.686-11.578l.147-.491c.242-.745.573-1.44.972-2.078Z" />
          </svg>
        </button>
      </div>

      {/* USER ACCOUNT / GOOGLE SIGN-IN ONBOARDING BUTTON */}
      {currentUser ? (
        <button
          type="button"
          className="icon-nav-btn user-profile-btn"
          onClick={() => {
            soundService.playTap();
            hapticsService.light();
            setIsAuthModalOpen(true);
          }}
          aria-label="User Profile"
          title={`Signed in as ${currentUser.displayName || currentUser.email || 'User'}`}
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            padding: '2px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <span
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
              border: '1.5px solid rgba(15, 23, 42, 0.9)',
            }}
          />
        </button>
      ) : (
        <button
          type="button"
          className="google-signin-pill"
          onClick={() => {
            soundService.playOpen();
            hapticsService.light();
            setIsAuthModalOpen(true);
          }}
          aria-label="Sign in with Google"
          title="Sign in with Google"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '34px',
            padding: '0 12px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'var(--c-content)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
          <span>Sign in</span>
        </button>
      )}
    </div>
  );

  // Active block & wallpaper references
  const currentBlock = blocks.find(b => b.id === activeBlockId) || null;
  const safeWallpaperIdx = Math.abs(wallpaperIndex || 0) % WALLPAPERS.length;
  const currentWallpaper = WALLPAPERS[safeWallpaperIdx] || WALLPAPERS[0];

  return (
    <>
      {/* 4K ULTRA-HD SPACE, UNIVERSE & NATURE WALLPAPER BACKDROP (UNSHADED) */}
      <div
        id="space"
        style={{
          backgroundImage: `url("${currentWallpaper.url}"), radial-gradient(ellipse at 50% 25%, #181c33 0%, #0a0c16 50%, #040508 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#07080a',
        }}
      >
        <img
          key={currentWallpaper.id}
          src={currentWallpaper.url}
          alt={currentWallpaper.title}
          className="wallpaper-img-layer"
          loading="eager"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0';
          }}
        />
      </div>
      <div id="grain" />

      {/* RENDER EITHER WORKSPACE OR HOME — NEVER BOTH (ELIMINATES OVERLAP) */}
      {currentBlock ? (
        /* Workspace View */
        <main className="app workspace-page">
          <nav className="top">
            <button className="back" onClick={closeWorkspace}>
              ← Blocks
            </button>
            {renderNavActions()}
          </nav>

          <h1
            className="title"
            title="Double-click to rename block"
            onDoubleClick={() => {
              const newName = window.prompt('Rename block:', currentBlock.name);
              if (newName && newName.trim()) {
                setBlocks(prev =>
                  prev.map(item =>
                    item.id === currentBlock.id ? { ...item, name: newName.trim() } : item
                  )
                );
              }
            }}
          >
            {currentBlock.name}
          </h1>

          {/* Tasks Section */}
          {currentBlock.tasks.length === 0 ? (
            <div className="tasks-empty">No tasks yet</div>
          ) : (
            <div className="todo glass">
              <div id="tasks">
                {currentBlock.tasks.map(t => (
                  <div key={t.id} className={`task ${t.done ? 'done' : ''}`}>
                    <input
                      className="check"
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTask(t.id, t.done)}
                      aria-label="Complete task"
                    />
                    <span className="tasktext">{t.text}</span>
                    <button
                      className="remove"
                      aria-label="Remove task"
                      onClick={() => removeTask(t.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Task Input Row (Spacious & iOS 26 Liquid Glass) */}
          <div className="addrow">
            <input
              ref={taskInputRef}
              id="taskInput"
              className="taskinput"
              placeholder="Add something to do..."
              autoComplete="off"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTask();
              }}
            />
            <button
              className="addtask"
              onClick={addTask}
              aria-label="Add task"
            >
              +
            </button>
          </div>

          {/* Attachments Section */}
          <div className="attach">
            <div className="attachbar">
              <button
                className="attachbtn"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add attachment
              </button>
              <input
                ref={fileInputRef}
                id="fileInput"
                className="fileinput"
                type="file"
                multiple
                onChange={e => {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {currentBlock.files && currentBlock.files.length > 0 && (
              <div id="files" className="files">
                {currentBlock.files.map(f => {
                  const kind = kindOf(f);
                  return (
                    <div
                      key={f.id}
                      className="file glass"
                      onClick={() => openViewer(f)}
                    >
                      <div className="filepreview">
                        {kind === 'image' ? (
                          <img src={f.data} alt={f.name} />
                        ) : kind === 'video' ? (
                          <video src={f.data} muted preload="metadata" />
                        ) : (
                          <div className="fileicon">{extOf(f).slice(0, 5)}</div>
                        )}
                      </div>

                      <button
                        className="filex"
                        aria-label="Remove attachment"
                        onClick={e => {
                          e.stopPropagation();
                          removeFile(f.id);
                        }}
                      >
                        ×
                      </button>

                      <div className="filemeta">
                        <div className="filetype">
                          {kind === 'file' ? 'DOCUMENT' : kind.toUpperCase()}
                        </div>
                        <div className="filename" title={f.name}>
                          {f.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Home Screen */
        <main className="app">
          <nav className="top">
            <div className="brand">Life of Blocks</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {renderNavActions()}
              <button className="plus" onClick={openCreate} aria-label="Add block">
                +
              </button>
            </div>
          </nav>

          <section className="hero">
            <h1>
              Your life.
              <br />
              In blocks.
            </h1>
            <p>Keep every little thing in its own place.</p>
          </section>

          {blocks.length === 0 ? (
            <section id="empty" className="empty">
              <strong>Nothing here yet.</strong>
              <br />
              <span>Create your first block.</span>
            </section>
          ) : (
            <section id="blocks" className="blocks">
              {blocks.map(b => {
                const doneCount = b.tasks.filter(t => t.done).length;
                const totalCount = b.tasks.length;
                const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                const previewTasks = b.tasks.slice(0, 3);

                return (
                  <article
                    key={b.id}
                    className="block glass"
                    onClick={() => openWorkspace(b.id)}
                  >
                    <div className="blocktop">
                      <div
                        className="blockname"
                        title="Double-click to rename"
                        onDoubleClick={e => {
                          e.stopPropagation();
                          const newName = window.prompt('Rename block:', b.name);
                          if (newName && newName.trim()) {
                            setBlocks(prev =>
                              prev.map(item =>
                                item.id === b.id ? { ...item, name: newName.trim() } : item
                              )
                            );
                          }
                        }}
                      >
                        {b.name}
                      </div>
                      <button
                        className="menu"
                        aria-label="Delete block"
                        onClick={e => {
                          e.stopPropagation();
                          deleteBlock(b.id, b.name);
                        }}
                      >
                        ···
                      </button>
                    </div>

                    <div className="preview">
                      {previewTasks.length > 0 ? (
                        previewTasks.map(t => (
                          <div key={t.id} className={`previewrow ${t.done ? 'done' : ''}`}>
                            <span className="dot" />
                            <span>{t.text}</span>
                          </div>
                        ))
                      ) : (
                        <div className="empty-preview">No tasks yet</div>
                      )}
                    </div>

                    <div className="footer">
                      <div className="footer-status">
                        <span>{doneCount} / {totalCount} completed</span>
                        {totalCount > 0 && <span className="footer-pct">{percent}%</span>}
                      </div>
                      {totalCount > 0 && (
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </main>
      )}

      {/* 9-DOT APPS & SHORTCUTS MODAL */}
      <AppLauncherModal
        isOpen={isAppLauncherOpen}
        onClose={() => setIsAppLauncherOpen(false)}
        apps={apps}
        onAddApp={(newApp) => setApps(prev => [newApp, ...prev])}
        onDeleteApp={(id) => setApps(prev => prev.filter(a => a.id !== id))}
        onReorderApps={(newApps) => setApps(newApps)}
      />

      {/* 4K WALLPAPER GALLERY & SELECTOR MODAL */}
      <WallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        currentIndex={wallpaperIndex % WALLPAPERS.length}
        onSelect={(idx) => {
          setWallpaperLoaded(false);
          setWallpaperIndex(idx);
          setIsWallpaperModalOpen(false);
        }}
        onRandom={() => {
          setWallpaperLoaded(false);
          setWallpaperIndex(prev => (prev + 1) % WALLPAPERS.length);
        }}
      />

      {/* FIREBASE GOOGLE AUTH & ONBOARDING MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Create Block Modal */}
      <div
        id="overlay"
        className={`overlay ${isCreateOpen ? 'open' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) closeCreate();
        }}
      >
        <div className="modal">
          <h2>New block</h2>
          <input
            ref={blockInputRef}
            id="blockInput"
            className="input"
            placeholder="Taiwan, GATE, Music..."
            autoComplete="off"
            value={blockNameInput}
            onChange={e => setBlockNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') createBlock();
              if (e.key === 'Escape') closeCreate();
            }}
          />
          <div className="actions">
            <button className="cancel" onClick={closeCreate}>
              Cancel
            </button>
            <button className="create" onClick={() => createBlock()}>
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen File Viewer */}
      {viewerFile && (
        <div
          id="viewer"
          className="viewer open"
          onClick={e => {
            if (e.target === e.currentTarget) closeViewer();
          }}
        >
          <div className="viewerbox">
            <div className="viewerhead">
              <div id="viewerName" className="viewername" title={viewerFile.name}>
                {viewerFile.name}
              </div>
              <div className="vieweractions">
                <a
                  id="downloadBtn"
                  className="download"
                  href={activeBlobUrl || viewerFile.data}
                  download={viewerFile.name}
                >
                  Save
                </a>
                <button
                  className="viewerclose"
                  onClick={closeViewer}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div id="viewerBody" className="viewerbody">
              {(() => {
                const kind = kindOf(viewerFile);
                const fileUrl = activeBlobUrl || viewerFile.data;

                if (kind === 'image') {
                  return <img src={fileUrl} alt={viewerFile.name} />;
                }
                if (kind === 'video') {
                  return (
                    <video
                      src={fileUrl}
                      controls
                      autoPlay={false}
                      playsInline
                    />
                  );
                }
                if (kind === 'audio') {
                  return <audio src={fileUrl} controls />;
                }
                if (kind === 'pdf') {
                  return <iframe src={fileUrl} title={viewerFile.name} />;
                }
                if (kind === 'text') {
                  let textContent = viewerFile.data;
                  try {
                    if (viewerFile.data.startsWith('data:')) {
                      const comma = viewerFile.data.indexOf(',');
                      textContent = decodeURIComponent(escape(atob(viewerFile.data.slice(comma + 1))));
                    }
                  } catch {
                    try {
                      const comma = viewerFile.data.indexOf(',');
                      textContent = decodeURIComponent(viewerFile.data.slice(comma + 1));
                    } catch {
                      textContent = 'Unable to decode text stream preview. Use Save to view the raw file.';
                    }
                  }
                  return <pre className="textviewer">{textContent}</pre>;
                }
                return (
                  <div className="genericviewer">
                    <div>
                      <div className="bigicon">{extOf(viewerFile).slice(0, 6)}</div>
                      <h2 style={{ margin: '0 0 8px', fontSize: '20px', color: 'var(--c-content)' }}>
                        {viewerFile.name}
                      </h2>
                      <p style={{ margin: 0, color: 'var(--c-muted)', fontSize: '14px' }}>
                        This file is safely stored in this block.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div id="viewerFoot" className="viewerfoot">
              {(() => {
                const kind = kindOf(viewerFile);
                if (kind === 'image') return 'Image preview';
                if (kind === 'video') return 'Video preview';
                if (kind === 'audio') return 'Audio preview';
                if (kind === 'pdf') return 'PDF document • use the Save button if your browser does not embed PDFs';
                if (kind === 'text') return 'Text / code preview';
                return 'Preview unavailable for this file type • use Save';
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
