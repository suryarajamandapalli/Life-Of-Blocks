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
import { 
  getRandomWallpaper, 
  preloadWallpaperImage, 
  getFastFallbackWallpaper 
} from './services/wallpapers';
import { 
  isWallpaperLocked, 
  getLockedWallpaper, 
  setWallpaperLock, 
  subscribeWallpaperStore 
} from './services/wallpaperStore';
import { sound } from './services/sound';

import MainScreen from './components/MainScreen';
import BlockView from './components/BlockView';
import CreateBlockModal from './components/CreateBlockModal';
import ConfirmModal from './components/ConfirmModal';
import PomodoroWidget from './components/PomodoroWidget';
import AppTray from './components/AppTray';
import QuickNotesModal from './components/QuickNotesModal';
import GoogleAuthButton from './components/GoogleAuthButton';
import WallpaperControls from './components/WallpaperControls';
import StarredWallpapersModal from './components/StarredWallpapersModal';
import GlowingGridLoader from './components/GlowingGridLoader';

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [currentBlockId, setCurrentBlockId] = useState(null);
  const [files, setFiles] = useState([]);

  // Modals & Panels state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(null);
  const [isAppTrayOpen, setIsAppTrayOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState(null);

  // Dual-Buffer Wallpaper System (ZERO flash to black, smooth crossfade)
  const [currentWallpaper, setCurrentWallpaper] = useState(() => {
    if (isWallpaperLocked()) {
      const lockedWp = getLockedWallpaper();
      if (lockedWp) return lockedWp;
    }
    return getRandomWallpaper();
  });
  const [nextWallpaper, setNextWallpaper] = useState(null);
  const [nextWallpaperFadingIn, setNextWallpaperFadingIn] = useState(false);
  const [isWallpaperLoading, setIsWallpaperLoading] = useState(false);
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

  const handleToggleAmbient = (type) => {
    if (activeAmbient === type) {
      sound.stopAmbient();
      setActiveAmbient(null);
    } else {
      sound.startAmbient(type);
      setActiveAmbient(type);
    }
  };

  // Smooth Crossfade Wallpaper Application
  const applyWallpaper = useCallback(async (candidate) => {
    if (!candidate) return;
    if (candidate.id === currentWallpaper.id && !nextWallpaper) return;

    setIsRefreshingWallpaper(true);
    setIsWallpaperLoading(true);
    setNextWallpaper(candidate);
    setNextWallpaperFadingIn(false);

    try {
      // Preload 4K image into browser cache
      await preloadWallpaperImage(candidate.url, 8000);

      // Image is 100% loaded and decoded. Smoothly fade it in!
      setNextWallpaperFadingIn(true);

      setTimeout(() => {
        setCurrentWallpaper(candidate);
        setNextWallpaper(null);
        setNextWallpaperFadingIn(false);
        setIsWallpaperLoading(false);
        setIsRefreshingWallpaper(false);
      }, 700);
    } catch (err) {
      console.warn('Preload failed for candidate, using fast fallback:', err);
      const fallback = getFastFallbackWallpaper(candidate.id);
      try {
        await preloadWallpaperImage(fallback.url, 6000);
        setNextWallpaper(fallback);
        setNextWallpaperFadingIn(true);
        setTimeout(() => {
          setCurrentWallpaper(fallback);
          setNextWallpaper(null);
          setNextWallpaperFadingIn(false);
          setIsWallpaperLoading(false);
          setIsRefreshingWallpaper(false);
        }, 700);
      } catch {
        setIsWallpaperLoading(false);
        setIsRefreshingWallpaper(false);
        setNextWallpaper(null);
      }
    }
  }, [currentWallpaper.id, nextWallpaper]);

  // Shuffle to another random wallpaper
  const handleNextWallpaper = useCallback(async () => {
    if (isWallpaperLoading) return;
    const next = getRandomWallpaper(currentWallpaper.id);
    await applyWallpaper(next);
  }, [isWallpaperLoading, currentWallpaper.id, applyWallpaper]);

  // Select wallpaper directly from Starred Gallery
  const handleSelectWallpaper = useCallback(async (selectedWp) => {
    if (isWallpaperLocked()) {
      setWallpaperLock(true, selectedWp);
    }
    await applyWallpaper(selectedWp);
  }, [applyWallpaper]);

  // Listen for Wallpaper Lock updates across devices via RTDB
  useEffect(() => {
    const unsub = subscribeWallpaperStore(() => {
      if (isWallpaperLocked()) {
        const lockedWp = getLockedWallpaper();
        if (lockedWp && lockedWp.id !== currentWallpaper?.id && lockedWp.id !== nextWallpaper?.id) {
          applyWallpaper(lockedWp);
        }
      }
    });
    return () => unsub();
  }, [currentWallpaper?.id, nextWallpaper?.id, applyWallpaper]);

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
    }
  }, [currentBlockId]);

  // Global Keyboard Shortcuts
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
      {/* ========================================================
          DUAL-LAYER 4K WALLPAPER SYSTEM (ZERO FLASH TO BLACK)
          Layer A: Current wallpaper stays at 100% opacity.
          Layer B: Next wallpaper crossfades over Layer A when loaded.
          ======================================================== */}
      
      {/* LAYER A: Current Wallpaper (Always visible, solid backing) */}
      <div 
        ref={wallpaperImgRef}
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('${currentWallpaper.url}')`,
          transform: 'translateZ(0)',
        }}
      />

      {/* LAYER B: Next Wallpaper (Fades in seamlessly over Layer A) */}
      {nextWallpaper && (
        <div 
          className={`fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-700 ease-in-out ${
            nextWallpaperFadingIn ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${nextWallpaper.url}')`,
            transform: 'translateZ(0)',
          }}
        />
      )}

      {/* GLOWING TRANSPARENT GRID BLOCKS: Animated waves during 4K image load */}
      <GlowingGridLoader isVisible={isWallpaperLoading} />

      {/* Gentle Scrim — Maximum Wallpaper Dominance & Clarity */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.16) 100%)'
        }}
      />

      {/* Top Controls: Google Auth & Wallpaper Controls */}
      <div className="fixed top-3.5 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-2">
        {/* Google Authentication & RTDB Sync Button */}
        <GoogleAuthButton />

        {/* Interactive Wallpaper Controls (Shuffle on click; Lock, Star & 3x3 Gallery on hover/long-press) */}
        <WallpaperControls
          currentWallpaper={currentWallpaper}
          onRefresh={handleNextWallpaper}
          isRefreshing={isRefreshingWallpaper || isWallpaperLoading}
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
            wallpaper={currentWallpaper}
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
            wallpaper={currentWallpaper}
            onOpenBlock={(block) => setCurrentBlockId(block.id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRequestDeleteBlock={(block) => setDeletingBlock(block)}
          />
        )}
      </main>

      {/* 3D Transparent Pomodoro Widget (Left Bottom, 25m/5m, Stored) */}
      <PomodoroWidget
        isVisible={isPomodoroVisible}
        onClose={() => handleTogglePomodoro()}
      />

      {/* App Tray (Toggled with Right Shift) */}
      <AppTray
        isOpen={isAppTrayOpen}
        onClose={() => setIsAppTrayOpen(false)}
        isPomodoroVisible={isPomodoroVisible}
        onTogglePomodoro={handleTogglePomodoro}
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
        activeWallpaper={currentWallpaper}
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
    </div>
  );
}
