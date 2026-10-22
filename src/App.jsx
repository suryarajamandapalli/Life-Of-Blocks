import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';
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
import { sound } from './services/sound';

import MainScreen from './components/MainScreen';
import BlockView from './components/BlockView';
import CreateBlockModal from './components/CreateBlockModal';
import ConfirmModal from './components/ConfirmModal';
import PomodoroWidget from './components/PomodoroWidget';
import AppTray from './components/AppTray';
import QuickNotesModal from './components/QuickNotesModal';
import GoogleAuthButton from './components/GoogleAuthButton';

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
  const [activeAmbient, setActiveAmbient] = useState(null);

  // Random wallpaper strictly from Wallhaven
  const [wallpaper, setWallpaper] = useState(() => getRandomWallpaper());
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
        const randomItem = liveList[Math.floor(Math.random() * liveList.length)];
        setWallpaper(randomItem);
      }
    });
  }, []);

  // Shuffle to another random wallpaper
  const handleNextWallpaper = async () => {
    setIsRefreshingWallpaper(true);
    try {
      if (liveWallpapers.length > 1) {
        const remaining = liveWallpapers.filter(w => w.id !== wallpaper.id);
        const next = remaining[Math.floor(Math.random() * remaining.length)];
        setWallpaper(next);
      } else {
        const freshList = await fetchLiveWallhavenWallpapers();
        if (freshList && freshList.length > 0) {
          setLiveWallpapers(freshList);
          const next = freshList[Math.floor(Math.random() * freshList.length)];
          setWallpaper(next);
        }
      }
    } finally {
      setTimeout(() => setIsRefreshingWallpaper(false), 350);
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

  // Global Keyboard Navigation: Esc -> Home, Right Shift -> App Tray, P -> Pomodoro, N -> New
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

      // Esc -> Home (or close open overlays)
      if (e.key === 'Escape') {
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

      // P or Right Shift + P -> Pomodoro
      if (e.code === 'KeyP') {
        e.preventDefault();
        if (isRightShiftDownRef.current) didComboRef.current = true;
        handleTogglePomodoro();
        return;
      }

      // N or Right Shift + N on home screen -> Create Block
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

      {/* Top Controls: Google Auth & Real-Time Sync Indicator + Wallpaper Shuffle */}
      <div className="fixed top-3.5 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-2">
        {/* Google Authentication & Firestore Sync Button */}
        <GoogleAuthButton />

        {/* Wallpaper Shuffle Button — Pure Icon, Zero Text */}
        <button
          onClick={handleNextWallpaper}
          disabled={isRefreshingWallpaper}
          title="Shuffle Wallpaper"
          aria-label="Shuffle Wallpaper"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/65 text-white/60 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer shadow-lg active:scale-95 select-none"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshingWallpaper ? 'animate-spin text-white' : ''}`} />
        </button>
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
