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
  const [calmModeBlock, setCalmModeBlock] = useState(null);
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

  // Spotify Web Player Widget (toggled with S key or button)
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(() => {
    try {
      return localStorage.getItem('lob_spotify_visible') === 'true';
    } catch {
      return false;
    }
  });

  // Active widget on mobile when both are open ('pomo' | 'spotify')
  const [mobileActiveWidget, setMobileActiveWidget] = useState('pomo');

  const handleTogglePomodoro = () => {
    setIsPomodoroVisible((prev) => {
      const next = !prev;
      if (next) setMobileActiveWidget('pomo');
      try {
        localStorage.setItem('lob_pomodoro_visible', String(next));
      } catch (e) {
        console.warn('Could not save pomodoro visibility:', e);
      }
      return next;
    });
  };

  const handleToggleSpotify = () => {
    setIsSpotifyVisible((prev) => {
      const next = !prev;
      if (next) setMobileActiveWidget('spotify');
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
    // Only randomize if no active or locked wallpaper is saved in cloud or cache
    const existing = isWallpaperLocked() ? getLockedWallpaper() : getActiveWallpaper();
    if (!existing) {
      fetchLiveWallhavenWallpapers().then((liveList) => {
        if (liveList && liveList.length > 0) {
          const randomItem = liveList[Math.floor(Math.random() * liveList.length)];
          setWallpaper(randomItem);
          setActiveWallpaper(randomItem);
        }
      });
    }
  }, []);

  // Listen for Active Wallpaper & Lock updates across devices in real-time via RTDB
  useEffect(() => {
    const handleRemoteWallpaperUpdate = () => {
      if (isWallpaperLocked()) {
        const lockedWp = getLockedWallpaper();
        if (lockedWp && (lockedWp.id !== wallpaper?.id || lockedWp.url !== wallpaper?.url)) {
          setWallpaper(lockedWp);
        }
      } else {
        const syncedWp = getActiveWallpaper();
        if (syncedWp && (syncedWp.id !== wallpaper?.id || syncedWp.url !== wallpaper?.url)) {
          setWallpaper(syncedWp);
        }
      }
    };

    handleRemoteWallpaperUpdate();
    const unsub = subscribeWallpaperStore(handleRemoteWallpaperUpdate);
    return () => unsub();
  }, [wallpaper?.id, wallpaper?.url]);

  // Shuffle to another random wallpaper and sync to ALL devices in real time
  const handleNextWallpaper = async () => {
    setIsRefreshingWallpaper(true);
    try {
      // Fetch a fresh batch of live random 4K wallpapers from Wallhaven
      const freshList = await fetchLiveWallhavenWallpapers();
      let nextWp = null;
      if (freshList && freshList.length > 0) {
        const remaining = freshList.filter(w => w.url !== wallpaper?.url);
        nextWp = remaining.length > 0 ? remaining[Math.floor(Math.random() * remaining.length)] : freshList[0];
      }
      if (nextWp) {
        setWallpaper(nextWp);
        // Sync across ALL devices in real time via RTDB!
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

  const triggerCalmMode = useCallback((block) => {
    setCalmModeBlock(block || null);
    setCalmModeBlockName(block?.name || '');
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
        triggerCalmMode(b);
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

      {/* ========================================================
          FLOATING WIDGETS CONSOLE: RESPONSIVE DUAL-DOCK ARCHITECTURE
          - Desktop (sm+): 
              * Pomodoro docked at BOTTOM-LEFT (bottom-5 left-6)
              * Spotify docked at BOTTOM-RIGHT (bottom-5 right-6)
              * Zero overlap, zero tall stacking, full clear view of center blocks!
          - Mobile (<sm): 
              * Centered bottom dock with clean segmented switcher tab when both are open
              * Zero horizontal cutoff, safe-area inset padding, perfectly responsive
          ======================================================== */}

      {/* 1. DESKTOP DOCK (sm: screens and up) */}
      <div className="hidden sm:block">
        {/* Desktop Bottom-Left: Pomodoro Timer */}
        {isPomodoroVisible && (
          <div className="fixed bottom-5 left-6 z-40 select-none pointer-events-none animate-modal-in">
            <div className="pointer-events-auto">
              <PomodoroWidget
                isVisible={true}
                onClose={handleTogglePomodoro}
                onToggleSpotify={handleToggleSpotify}
                isSpotifyVisible={isSpotifyVisible}
              />
            </div>
          </div>
        )}

        {/* Desktop Bottom-Right: Spotify Lo-Fi Player */}
        {isSpotifyVisible && (
          <div className="fixed bottom-5 right-6 z-40 select-none pointer-events-none animate-modal-in">
            <div className="pointer-events-auto">
              <SpotifyWidget
                isVisible={true}
                onClose={handleToggleSpotify}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. MOBILE DOCK (<sm screens / Phones & APK) */}
      <div className="sm:hidden">
        {(isPomodoroVisible || isSpotifyVisible) && (
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-[min(320px,calc(100vw-24px))] pb-[env(safe-area-inset-bottom,4px)] select-none pointer-events-none flex flex-col items-center">
            {/* Mobile Tab Switcher when BOTH are open */}
            {isPomodoroVisible && isSpotifyVisible && (
              <div className="flex items-center gap-1 mb-2 px-1 pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-lg">
                <button
                  type="button"
                  onClick={() => setMobileActiveWidget('pomo')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    mobileActiveWidget === 'pomo'
                      ? 'bg-red-500/90 text-white shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>⏱️</span>
                  <span>Focus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveWidget('spotify')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    mobileActiveWidget === 'spotify'
                      ? 'bg-[#1DB954]/90 text-white shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>🎵</span>
                  <span>Spotify</span>
                </button>
              </div>
            )}

            {/* Active Mobile Widget */}
            <div className="w-full pointer-events-auto flex justify-center">
              {/* Show Pomodoro if only Pomodoro is open, or if both are open and 'pomo' is selected */}
              {isPomodoroVisible && (!isSpotifyVisible || mobileActiveWidget === 'pomo') && (
                <PomodoroWidget
                  isVisible={true}
                  onClose={handleTogglePomodoro}
                  onToggleSpotify={() => {
                    handleToggleSpotify();
                    setMobileActiveWidget('spotify');
                  }}
                  isSpotifyVisible={isSpotifyVisible}
                />
              )}

              {/* Show Spotify if only Spotify is open, or if both are open and 'spotify' is selected */}
              {isSpotifyVisible && (!isPomodoroVisible || mobileActiveWidget === 'spotify') && (
                <SpotifyWidget
                  isVisible={true}
                  onClose={handleToggleSpotify}
                />
              )}
            </div>
          </div>
        )}
      </div>

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

      {/* Zen Mode (Break the Block -> Glass Shatter -> 4K Nature/Space/Rain Zen Mode) */}
      <CalmModeOverlay
        isActive={isCalmModeActive}
        block={calmModeBlock}
        blockName={calmModeBlockName}
        totalTasks={todos.filter(t => t.blockId === calmModeBlock?.id).length}
        onClose={() => {
          setIsCalmModeActive(false);
          setCalmModeBlock(null);
        }}
      />
    </div>
  );
}
