import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getBlocks, 
  createBlock, 
  deleteBlock, 
  getTodos, 
  addTodo, 
  updateTodo, 
  deleteTodo, 
  getFilesByBlock, 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  subscribeToStorage 
} from './services/storage';
import { getRandomWallpaper, fetchLiveWallhavenWallpapers } from './services/wallpapers';
import { 
  isWallpaperLocked, 
  getLockedWallpaper, 
  setWallpaperLock, 
  getActiveWallpaper,
  setActiveWallpaper,
  subscribeWallpaperStore 
} from './services/wallpaperStore';
import { sound } from './services/sound';

import MainScreen from './components/MainScreen';
import BlockView from './components/BlockView';
import CreateBlockModal from './components/CreateBlockModal';
import ConfirmModal from './components/ConfirmModal';
import PomodoroWidget from './components/PomodoroWidget';
import SpotifyWidget from './components/SpotifyWidget';
import AppTray from './components/AppTray';
import QuickNotesModal from './components/QuickNotesModal';
import GoogleAuthButton from './components/GoogleAuthButton';
import SyncStatusBadge from './components/SyncStatusBadge';
import WallpaperControls from './components/WallpaperControls';
import StarredWallpapersModal from './components/StarredWallpapersModal';
import CalmModeOverlay from './components/CalmModeOverlay';

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [files, setFiles] = useState([]);

  // Zen Mode (triggered on block completion, stays until user chooses to return)
  const [isCalmModeActive, setIsCalmModeActive] = useState(false);
  const [calmModeBlockName, setCalmModeBlockName] = useState('');
  const prevCompletionRef = useRef(new Map());
  const isInitialMountRef = useRef(true);

  // Modals & Panels state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(null);
  const [isAppTrayOpen, setIsAppTrayOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState(null);

  // Wallpaper state (restores synced active/locked wallpaper across all devices)
  const [wallpaper, setWallpaper] = useState(() => {
    if (isWallpaperLocked()) {
      const lockedWp = getLockedWallpaper();
      if (lockedWp) return lockedWp;
    }
    const syncedActive = getActiveWallpaper();
    if (syncedActive) return syncedActive;
    return getRandomWallpaper();
  });
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false);
  const [liveWallpapers, setLiveWallpapers] = useState([]);
  const [isRefreshingWallpaper, setIsRefreshingWallpaper] = useState(false);
  const wallpaperImgRef = useRef(null);

  // 3D Transparent Pomodoro Widget (stored in localStorage)
  const [isPomodoroVisible, setIsPomodoroVisible] = useState(() => {
    try {
      return localStorage.getItem('lob_pomodoro_visible') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePomodoro = () => {
    setIsPomodoroVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lob_pomodoro_visible', String(next));
      } catch (e) {
        console.warn('Could not save pomodoro visibility:', e);
      }
      return next;
    });
  };

  // Spotify Web Player Widget (toggled with S key or button)
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(() => {
    try {
      return localStorage.getItem('lob_spotify_visible') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSpotify = () => {
    setIsSpotifyVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lob_spotify_visible', String(next));
      } catch (e) {
        console.warn('Could not save spotify visibility:', e);
      }
      return next;
    });
  };

  const handleToggleAmbient = (type) => {
    if (activeAmbient === type) {
      sound.stopAmbient();
      setActiveAmbient(null);
    } else {
      sound.startAmbient(type);
      setActiveAmbient(type);
    }
  };

  // Fetch live random Wallhaven wallpapers on startup
  useEffect(() => {
    fetchLiveWallhavenWallpapers().then((liveList) => {
      if (liveList && liveList.length > 0) {
        setLiveWallpapers(liveList);
        // Only randomize if no active or locked wallpaper is saved in cloud or cache
        const existing = isWallpaperLocked() ? getLockedWallpaper() : getActiveWallpaper();
        if (!existing) {
          const randomItem = liveList[Math.floor(Math.random() * liveList.length)];
          setWallpaper(randomItem);
          setActiveWallpaper(randomItem);
        }
      }
    });
  }, []);

  // Listen for Active Wallpaper & Lock updates across devices in real-time via RTDB
  useEffect(() => {
    const handleRemoteWallpaperUpdate = () => {
      if (isWallpaperLocked()) {
        const lockedWp = getLockedWallpaper();
        if (lockedWp && lockedWp.id !== wallpaper?.id) {
          setWallpaper(lockedWp);
        }
      } else {
        const syncedWp = getActiveWallpaper();
        if (syncedWp && syncedWp.id !== wallpaper?.id) {
          setWallpaper(syncedWp);
        }
      }
    };

    handleRemoteWallpaperUpdate();
    const unsub = subscribeWallpaperStore(handleRemoteWallpaperUpdate);
    return () => unsub();
  }, [wallpaper?.id]);

  // Shuffle to another random wallpaper and sync to ALL devices in real time
  const handleNextWallpaper = async () => {
    setIsRefreshingWallpaper(true);
    try {
      let nextWp = null;
      if (liveWallpapers.length > 1) {
        const remaining = liveWallpapers.filter(w => w.id !== wallpaper?.id);
        nextWp = remaining[Math.floor(Math.random() * remaining.length)];
      } else {
        const freshList = await fetchLiveWallhavenWallpapers();
        if (freshList && freshList.length > 0) {
          setLiveWallpapers(freshList);
          nextWp = freshList[Math.floor(Math.random() * freshList.length)];
        }
      }
      if (nextWp) {
        setWallpaper(nextWp);
        await setActiveWallpaper(nextWp);
      }
    } finally {
      setTimeout(() => setIsRefreshingWallpaper(false), 350);
    }
  };

  // Select wallpaper directly from Starred Gallery and sync to ALL devices
  const handleSelectWallpaper = async (selectedWp) => {
    setWallpaper(selectedWp);
    await setActiveWallpaper(selectedWp);
    if (isWallpaperLocked()) {
      await setWallpaperLock(true, selectedWp);
    }
  };

  // Preload wallpaper
  useEffect(() => {
    setWallpaperLoaded(false);
    const img = new Image();
    img.src = wallpaper.url;
    img.onload = () => setWallpaperLoaded(true);
    img.onerror = () => setWallpaperLoaded(true);
  }, [wallpaper]);

  // Sync data from local & cloud storage
  const syncData = useCallback(() => {
    const loadedBlocks = getBlocks();
    const loadedTodos = getTodos();
    setBlocks(loadedBlocks);
    setTodos(loadedTodos);

    if (currentBlockId) {
      setFiles(getFilesByBlock(currentBlockId));
    }
  }, [currentBlockId]);

  useEffect(() => {
    syncData();
    const unsubscribe = subscribeToStorage(syncData);
    return () => unsubscribe();
  }, [syncData]);

  // When opening a block, sync its files
  useEffect(() => {
    if (currentBlockId) {
      setFiles(getFilesByBlock(currentBlockId));
    } else {
      setFiles([]);
    }
  }, [currentBlockId]);

  const triggerCalmMode = useCallback((name) => {
    setCalmModeBlockName(name || '');
    setIsCalmModeActive(true);
  }, []);

  // Monitor blocks for 100% completion transition (Calm Mode trigger)
  useEffect(() => {
    if (blocks.length === 0) return;

    if (isInitialMountRef.current) {
      blocks.forEach((b) => {
        const bTodos = todos.filter((t) => t.blockId === b.id);
        const isDone = bTodos.length > 0 && bTodos.every((t) => t.completed);
        prevCompletionRef.current.set(b.id, isDone);
      });
      isInitialMountRef.current = false;
      return;
    }

    blocks.forEach((b) => {
      const bTodos = todos.filter((t) => t.blockId === b.id);
      const isDone = bTodos.length > 0 && bTodos.every((t) => t.completed);
      const wasDone = prevCompletionRef.current.get(b.id);

      // Trigger Calm Mode when transitioning from incomplete to 100% completed
      if (wasDone === false && isDone === true) {
        triggerCalmMode(b.name);
      }

      prevCompletionRef.current.set(b.id, isDone);
    });
  }, [todos, blocks, triggerCalmMode]);

  // Global Keyboard Navigation
  const isRightShiftDownRef = useRef(false);
  const didComboRef = useRef(false);

  useEffect(() => {
    const isInputActive = () => {
      const el = document.activeElement;
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      if (e.code === 'ShiftRight') {
        isRightShiftDownRef.current = true;
        didComboRef.current = false;
      }

      if (isInputActive()) {
        return;
      }

      if (e.key === 'Escape') {
        if (isGalleryOpen) {
          setIsGalleryOpen(false);
          return;
        }
        if (isAppTrayOpen) {
          setIsAppTrayOpen(false);
          return;
        }
        if (isScratchpadOpen) {
          setIsScratchpadOpen(false);
          return;
        }
        if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
          return;
        }
        if (isSpotifyVisible) {
          setIsSpotifyVisible(false);
          return;
        }
        if (deletingBlock) {
          setDeletingBlock(null);
          return;
        }
        if (currentBlockId) {
          setCurrentBlockId(null);
          return;
        }
      }

      if (e.code === 'KeyP') {
        e.preventDefault();
        if (isRightShiftDownRef.current) didComboRef.current = true;
        handleTogglePomodoro();
        return;
      }

      if (e.code === 'KeyS') {
        e.preventDefault();
        if (isRightShiftDownRef.current) didComboRef.current = true;
        handleToggleSpotify();
        return;
      }

      if (e.code === 'KeyN' && !currentBlockId) {
        e.preventDefault();
        if (isRightShiftDownRef.current) didComboRef.current = true;
        setIsCreateModalOpen(true);
        return;
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'ShiftRight') {
        if (!didComboRef.current && !isInputActive()) {
          setIsAppTrayOpen((prev) => !prev);
        }
        isRightShiftDownRef.current = false;
        didComboRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isGalleryOpen,
    isAppTrayOpen,
    isScratchpadOpen,
    isCreateModalOpen,
    deletingBlock,
    currentBlockId
  ]);

  // Handlers
  const handleCreateBlock = (name) => {
    const newBlockId = createBlock(name);
    if (newBlockId) {
      setCurrentBlockId(newBlockId);
    }
  };

  const handleDeleteBlockConfirm = async () => {
    if (!deletingBlock) return;
    await deleteBlock(deletingBlock.id);
    if (currentBlockId === deletingBlock.id) {
      setCurrentBlockId(null);
    }
    setDeletingBlock(null);
  };

  const handleAddTodo = (_blockId, title) => {
    addTodo(currentBlockId, title);
  };

  const handleToggleTodo = (_blockId, todoId, completed) => {
    updateTodo(todoId, { completed });
  };

  const handleUpdateTodo = (_blockId, todoId, updates) => {
    updateTodo(todoId, updates);
  };

  const handleDeleteTodo = (_blockId, todoId) => {
    deleteTodo(todoId);
  };

  const handleUploadFile = async (blockId, file, onProgress) => {
    return uploadFile(blockId, file, onProgress);
  };

  const handleDownloadFile = async (file) => {
    return downloadFile(file);
  };

  const handleDeleteFile = async (_blockId, file) => {
    return deleteFile(file.id);
  };

  const activeBlock = blocks.find(b => b.id === currentBlockId);
  const activeTodos = todos.filter(t => t.blockId === currentBlockId);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col font-sans selection:bg-white/20 selection:text-white bg-[#050608] overflow-x-hidden">
      {/* 4K Wallhaven Wallpaper with Smooth Fade */}
      <div 
        ref={wallpaperImgRef}
        className={`fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-700 ease-in-out ${
          wallpaperLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url('${wallpaper.url}')`,
          transform: 'translateZ(0)',
        }}
      />

      {/* Gentle Scrim — Maximum Wallpaper Dominance & Clarity */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.16) 100%)'
        }}
      />

      {/* Top Controls: Sync Badge, Google Auth & Wallpaper Controls */}
      <div className="fixed top-3.5 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-2">
        {/* Realtime Database Sync Status Badge */}
        <SyncStatusBadge />

        {/* Google Authentication & RTDB Sync Button */}
        <GoogleAuthButton />

        {/* Interactive Wallpaper Controls (Shuffle on click; Lock, Star & 3x3 Gallery on hover/long-press) */}
        <WallpaperControls
          currentWallpaper={wallpaper}
          onRefresh={handleNextWallpaper}
          isRefreshing={isRefreshingWallpaper}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col w-full overflow-x-hidden">
        {currentBlockId && activeBlock ? (
          <BlockView
            block={activeBlock}
            todos={activeTodos}
            files={files}
            loadingTodos={false}
            loadingFiles={false}
            wallpaper={wallpaper}
            onBack={() => setCurrentBlockId(null)}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onUpdateTodo={handleUpdateTodo}
            onDeleteTodo={handleDeleteTodo}
            onUploadFile={handleUploadFile}
            onDownloadFile={handleDownloadFile}
            onDeleteFile={handleDeleteFile}
          />
        ) : (
          <MainScreen
            blocks={blocks}
            todos={todos}
            loading={false}
            wallpaper={wallpaper}
            onOpenBlock={(block) => setCurrentBlockId(block.id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRequestDeleteBlock={(block) => setDeletingBlock(block)}
          />
        )}
      </main>

      {/* Floating Widgets Console (Bottom-Left)
          - Desktop (sm+): Spotify pops up directly ABOVE Pomodoro with the exact same width
          - Mobile (<sm): Pomodoro and Spotify sit SIDE BY SIDE with smooth horizontal snap scroll */}
      {(isPomodoroVisible || isSpotifyVisible) && (
        <div className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:right-auto sm:left-6 z-40 flex flex-col sm:flex-col-reverse items-start select-none pointer-events-none">
          {/* Mobile fast switcher pills when both are open */}
          {isPomodoroVisible && isSpotifyVisible && (
            <div className="sm:hidden flex items-center gap-1.5 mb-2 px-1 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('lob-pomo-widget');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 hover:bg-black/80 text-white/90 border border-white/20 backdrop-blur-md cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <span>⏱️</span>
                <span>Focus</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('lob-spotify-widget');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 hover:bg-black/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-md cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <span>🎵</span>
                <span>Spotify</span>
              </button>
            </div>
          )}

          {/* Widgets Container */}
          <div 
            className="w-full max-w-[calc(100vw-24px)] sm:max-w-none flex flex-row sm:flex-col-reverse items-end sm:items-start gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible pb-1 select-none pointer-events-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isPomodoroVisible && (
              <div id="lob-pomo-widget" className="pointer-events-auto flex-shrink-0 snap-start">
                <PomodoroWidget
                  isVisible={true}
                  onClose={handleTogglePomodoro}
                  onToggleSpotify={handleToggleSpotify}
                  isSpotifyVisible={isSpotifyVisible}
                />
              </div>
            )}

            {isSpotifyVisible && (
              <div id="lob-spotify-widget" className="pointer-events-auto flex-shrink-0 snap-start">
                <SpotifyWidget
                  isVisible={true}
                  onClose={handleToggleSpotify}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Tray (Toggled with Right Shift) */}
      <AppTray
        isOpen={isAppTrayOpen}
        onClose={() => setIsAppTrayOpen(false)}
        isPomodoroVisible={isPomodoroVisible}
        onTogglePomodoro={handleTogglePomodoro}
        isSpotifyVisible={isSpotifyVisible}
        onToggleSpotify={handleToggleSpotify}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onNextWallpaper={handleNextWallpaper}
        onTriggerNewItem={() => {
          if (currentBlockId) {
            const event = new KeyboardEvent('keydown', { code: 'KeyN', bubbles: true });
            window.dispatchEvent(event);
          } else {
            setIsCreateModalOpen(true);
          }
        }}
        onTriggerUpload={() => {
          if (currentBlockId) {
            const event = new KeyboardEvent('keydown', { code: 'KeyO', bubbles: true });
            window.dispatchEvent(event);
          }
        }}
        activeAmbient={activeAmbient}
        onToggleAmbient={handleToggleAmbient}
      />

      {/* Quick Scratchpad Notes Modal */}
      <QuickNotesModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />

      {/* Starred Wallpapers 3x3 Gallery Modal */}
      <StarredWallpapersModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        activeWallpaper={wallpaper}
        onSelectWallpaper={handleSelectWallpaper}
      />

      {/* Create Block Modal */}
      <CreateBlockModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBlock}
      />

      {/* Delete Block Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBlock)}
        title={deletingBlock ? `Delete "${deletingBlock.name}" and all its contents?` : ''}
        onClose={() => setDeletingBlock(null)}
        onConfirm={handleDeleteBlockConfirm}
        confirmLabel="Delete"
        isDanger={true}
      />

      {/* Zen Mode (GSAP Animated 4K Video, Ambient Soaking Music & "Complete more Blocks in your life" CTA) */}
      <CalmModeOverlay
        isActive={isCalmModeActive}
        blockName={calmModeBlockName}
        onClose={() => setIsCalmModeActive(false)}
      />
    </div>
  );
}
