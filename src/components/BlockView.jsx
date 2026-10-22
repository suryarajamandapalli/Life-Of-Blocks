import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import TodoItem from './TodoItem';
import FileTile from './FileTile';
import FileViewer from './FileViewer';
import { useAdaptiveContrast } from '../hooks/useAdaptiveContrast';

export default function BlockView({
  block,
  todos = [],
  files = [],
  loadingTodos = false,
  loadingFiles = false,
  wallpaper,
  onBack,
  onAddTodo,
  onToggleTodo,
  onUpdateTodo,
  onDeleteTodo,
  onUploadFile,
  onDownloadFile,
  onDeleteFile
}) {
  // Localized Adaptive Contrast Refs
  const headerRef = useRef(null);
  const tasksRef = useRef(null);
  const filesRef = useRef(null);

  const headerContrast = useAdaptiveContrast(headerRef, wallpaper);
  const tasksContrast = useAdaptiveContrast(tasksRef, wallpaper);
  const filesContrast = useAdaptiveContrast(filesRef, wallpaper);

  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const todoInputRef = useRef(null);

  // Selected task & Long-press Delete key tracking (desktop power user)
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteHoldFrameRef = useRef(null);
  const deleteHoldStartRef = useRef(0);

  // Lightweight Undo Toast for Task Deletion
  const [undoTodo, setUndoTodo] = useState(null);
  const undoTimerRef = useRef(null);

  // File viewing and non-intrusive deletion confirmation
  const [viewingFile, setViewingFile] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const fileInputRef = useRef(null);

  // Maintain selected todo
  useEffect(() => {
    if (todos.length > 0) {
      if (!selectedTodoId || !todos.some((t) => t.id === selectedTodoId)) {
        setSelectedTodoId(todos[0].id);
      }
    } else {
      setSelectedTodoId(null);
    }
  }, [todos, selectedTodoId]);

  useEffect(() => {
    if (isAddingTodo) {
      todoInputRef.current?.focus();
    }
  }, [isAddingTodo]);

  // Keyboard Navigation: Esc -> Back, N -> Add Task, O -> Upload, Hold Del -> Delete Task
  useEffect(() => {
    const isInputActive = () => {
      const el = document.activeElement;
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      if (isInputActive()) {
        if (e.key === 'Escape' && isAddingTodo) {
          setIsAddingTodo(false);
          setNewTodoTitle('');
        }
        return;
      }

      // Esc -> Back to Home or dismiss active states
      if (e.key === 'Escape') {
        if (viewingFile) {
          setViewingFile(null);
          return;
        }
        if (deletingFile) {
          setDeletingFile(null);
          return;
        }
        if (isAddingTodo) {
          setIsAddingTodo(false);
          setNewTodoTitle('');
          return;
        }
        onBack();
        return;
      }

      // N -> Add Task
      if (e.code === 'KeyN') {
        e.preventDefault();
        setIsAddingTodo(true);
        return;
      }

      // O -> Upload File
      if (e.code === 'KeyO') {
        e.preventDefault();
        fileInputRef.current?.click();
        return;
      }

      // Long-press Delete key to delete selected task
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTodoId && !deleteHoldStartRef.current) {
          e.preventDefault();
          deleteHoldStartRef.current = Date.now();
          const HOLD_TIME = 600;

          const step = () => {
            const elapsed = Date.now() - deleteHoldStartRef.current;
            const prog = Math.min(1, elapsed / HOLD_TIME);
            setDeleteProgress(prog);

            if (prog < 1) {
              deleteHoldFrameRef.current = requestAnimationFrame(step);
            } else {
              deleteHoldStartRef.current = 0;
              setDeleteProgress(0);
              const todoToDelete = todos.find((t) => t.id === selectedTodoId);
              if (todoToDelete) {
                handleDeleteTask(todoToDelete);
              }
            }
          };

          deleteHoldFrameRef.current = requestAnimationFrame(step);
        }
      }

      // Arrow navigation between tasks
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currIdx = todos.findIndex((t) => t.id === selectedTodoId);
        if (currIdx < todos.length - 1) {
          setSelectedTodoId(todos[currIdx + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currIdx = todos.findIndex((t) => t.id === selectedTodoId);
        if (currIdx > 0) {
          setSelectedTodoId(todos[currIdx - 1].id);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (deleteHoldStartRef.current) {
          if (deleteHoldFrameRef.current) {
            cancelAnimationFrame(deleteHoldFrameRef.current);
          }
          deleteHoldStartRef.current = 0;
          setDeleteProgress(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (deleteHoldFrameRef.current) {
        cancelAnimationFrame(deleteHoldFrameRef.current);
      }
    };
  }, [
    block.id,
    todos,
    selectedTodoId,
    isAddingTodo,
    viewingFile,
    deletingFile,
    onBack
  ]);

  const handleCreateTodo = async (e) => {
    e?.preventDefault();
    const title = newTodoTitle.trim();
    if (!title) {
      setIsAddingTodo(false);
      return;
    }
    setNewTodoTitle('');
    setIsAddingTodo(false);
    try {
      await onAddTodo(block.id, title);
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  };

  const handleTodoInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateTodo();
    } else if (e.key === 'Escape') {
      setNewTodoTitle('');
      setIsAddingTodo(false);
    }
  };

  // Instant task deletion with non-intrusive Undo toast
  const handleDeleteTask = (todo) => {
    if (!todo) return;
    setUndoTodo(todo);
    onDeleteTodo(block.id, todo.id);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoTodo(null);
    }, 4500);
  };

  const handleUndoDelete = () => {
    if (!undoTodo) return;
    onAddTodo(block.id, undoTodo.title);
    setUndoTodo(null);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setUploadingFileName(file.name);
    setUploadProgress(10);

    try {
      await onUploadFile(block.id, file, (progress) => {
        setUploadProgress(progress);
      });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        setUploadingFileName('');
      }, 450);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <>
      {/* ========================================================
          01 — FLOATING TOP-LEFT BACK BUTTON
          Matches top-right controls alignment and liquid-glass style
          ======================================================== */}
      <div className="fixed top-3.5 left-4 sm:top-5 sm:left-6 z-20 flex items-center">
        <button
          onClick={onBack}
          title="Back to Blocks (Esc)"
          aria-label="Back to Blocks"
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 shadow-lg backdrop-blur-xl border ${
            headerContrast.isLight
              ? 'bg-white/65 hover:bg-white/85 border-black/15 text-zinc-900 hover:text-black'
              : 'bg-black/40 hover:bg-black/60 border-white/20 text-white/85 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* ========================================================
          02 — MAIN INNER BLOCK CONTAINER
          Distraction-free, minimal, zero bulky boxes
          ======================================================== */}
      <div 
        className="w-full max-w-[760px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-28 animate-page-in select-none"
      >
        {/* Block Header (Title only, no redundant metadata clutter) */}
        <div ref={headerRef} className="mb-8 sm:mb-10">
          <h1 
            className={`text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-tight break-words select-text transition-colors duration-200 ${
              headerContrast.isLight
                ? 'text-zinc-950 drop-shadow-[0_1px_6px_rgba(255,255,255,0.85)]'
                : 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]'
            }`}
          >
            {block.name}
          </h1>
        </div>

        {/* ========================================================
            03 — TASKS SECTION
            Pure floating rows: ○ Task name, zero lines cutting wallpaper
            ======================================================== */}
        <div ref={tasksRef} className="mb-10 sm:mb-12">
          {/* Section Heading & Counter */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span 
              className={`text-[11.5px] font-semibold tracking-[0.18em] uppercase ${
                tasksContrast.isLight 
                  ? 'text-zinc-800/80 drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]' 
                  : 'text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
              }`}
            >
              TASKS
            </span>
            {todos.length > 0 && (
              <span 
                className={`text-xs font-mono font-medium tracking-wider ${
                  tasksContrast.isLight ? 'text-zinc-700/70' : 'text-white/50'
                }`}
              >
                {completedCount} / {todos.length}
              </span>
            )}
          </div>

          {/* Loading Tasks */}
          {loadingTodos && (
            <div className={`py-3 text-xs tracking-wider px-1 ${tasksContrast.isLight ? 'text-zinc-700/60' : 'text-white/40'}`}>
              Loading tasks...
            </div>
          )}

          {/* Floating Task Rows: Distraction-free */}
          {!loadingTodos && todos.length > 0 && (
            <div className="flex flex-col gap-1 mb-2">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isSelected={todo.id === selectedTodoId}
                  deleteProgress={todo.id === selectedTodoId ? deleteProgress : 0}
                  onSelect={(t) => setSelectedTodoId(t.id)}
                  onToggle={(t) => onToggleTodo(block.id, t.id, !t.completed)}
                  onUpdate={(todoId, newTitle) => onUpdateTodo(block.id, todoId, { title: newTitle })}
                  onDelete={() => handleDeleteTask(todo)}
                  isLightMode={tasksContrast.isLight}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingTodos && todos.length === 0 && !isAddingTodo && (
            <div className="py-2 mb-2 px-1">
              <p className={`text-[13.5px] font-normal ${tasksContrast.isLight ? 'text-zinc-700/70' : 'text-white/45'}`}>
                No tasks yet
              </p>
            </div>
          )}

          {/* Inline Add Task Input */}
          {isAddingTodo ? (
            <form 
              onSubmit={handleCreateTodo} 
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 backdrop-blur-md border ${
                tasksContrast.isLight
                  ? 'bg-white/55 border-black/15 shadow-sm'
                  : 'bg-black/40 border-white/20 shadow-lg'
              }`}
            >
              <div className={`w-[19px] h-[19px] rounded-full border border-dashed flex-shrink-0 ${
                tasksContrast.isLight ? 'border-black/40' : 'border-white/40'
              }`} />
              <input
                ref={todoInputRef}
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={handleTodoInputKeyDown}
                placeholder="What needs to be done?"
                className={`flex-1 bg-transparent text-[15px] focus:outline-none ${
                  tasksContrast.isLight
                    ? 'text-zinc-950 placeholder-zinc-500'
                    : 'text-white placeholder-white/40'
                }`}
                maxLength={140}
              />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setNewTodoTitle('');
                    setIsAddingTodo(false);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    tasksContrast.isLight ? 'text-zinc-700 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTodoTitle.trim()}
                  className={`px-3 py-1 rounded-md text-xs font-semibold disabled:opacity-30 transition-all cursor-pointer shadow-sm active:scale-95 ${
                    tasksContrast.isLight
                      ? 'bg-zinc-950 text-white hover:bg-black'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTodo(true)}
              className={`inline-flex items-center gap-2 text-[13.5px] transition-all hover:translate-x-0.5 cursor-pointer select-none group py-2 px-1 ${
                tasksContrast.isLight
                  ? 'text-zinc-800/80 hover:text-black'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors border ${
                tasksContrast.isLight 
                  ? 'border-black/25 text-zinc-800 group-hover:border-black group-hover:bg-black/5' 
                  : 'border-white/30 text-white/70 group-hover:border-white group-hover:bg-white/10'
              }`}>
                ＋
              </span>
              <span className="font-normal drop-shadow-sm">
                {todos.length === 0 ? 'Add your first task' : 'Add task'}
              </span>
              <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
                tasksContrast.isLight ? 'bg-black/[0.08] text-zinc-800' : 'bg-white/[0.10] text-white/50'
              }`}>
                N
              </kbd>
            </button>
          )}
        </div>

        {/* ========================================================
            04 — FILES SECTION
            Visual media tiles, zero lines cutting wallpaper
            ======================================================== */}
        <div ref={filesRef}>
          {/* Section Heading & Counter */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span 
              className={`text-[11.5px] font-semibold tracking-[0.18em] uppercase ${
                filesContrast.isLight 
                  ? 'text-zinc-800/80 drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]' 
                  : 'text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'
              }`}
            >
              FILES
            </span>
            {files.length > 0 && (
              <span 
                className={`text-xs font-mono font-medium tracking-wider ${
                  filesContrast.isLight ? 'text-zinc-700/70' : 'text-white/50'
                }`}
              >
                {files.length}
              </span>
            )}
          </div>

          {/* Loading Files */}
          {loadingFiles && (
            <div className={`py-3 text-xs tracking-wider px-1 ${filesContrast.isLight ? 'text-zinc-700/60' : 'text-white/40'}`}>
              Loading files...
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className={`mb-3 p-3.5 rounded-xl border backdrop-blur-md ${
              filesContrast.isLight 
                ? 'bg-white/60 border-black/10 shadow-sm' 
                : 'bg-black/45 border-white/15'
            }`}>
              <div className={`flex items-center justify-between text-xs mb-2 ${
                filesContrast.isLight ? 'text-zinc-900' : 'text-white/85'
              }`}>
                <span className="truncate max-w-[260px]">Uploading {uploadingFileName}...</span>
                <span className={`font-mono ${filesContrast.isLight ? 'text-zinc-700' : 'text-white/55'}`}>
                  {uploadProgress}%
                </span>
              </div>
              <div className={`w-full h-1 rounded-full overflow-hidden ${filesContrast.isLight ? 'bg-black/10' : 'bg-white/15'}`}>
                <div
                  className={`h-full transition-all duration-150 ease-out rounded-full ${
                    filesContrast.isLight ? 'bg-zinc-950' : 'bg-white'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Visual Media Grid: Responsive, zero permanent labels */}
          {!loadingFiles && files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-3">
              {files.map((file) => (
                <FileTile
                  key={file.id}
                  file={file}
                  onOpenViewer={(f) => setViewingFile(f)}
                  onDownload={onDownloadFile}
                  onRequestDelete={(f) => setDeletingFile(f)}
                  isLightMode={filesContrast.isLight}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingFiles && files.length === 0 && uploadProgress === null && (
            <div className="py-2 mb-2 px-1">
              <p className={`text-[13.5px] font-normal ${filesContrast.isLight ? 'text-zinc-700/70' : 'text-white/45'}`}>
                No files yet
              </p>
            </div>
          )}

          {/* Hidden Native File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload File Trigger */}
          <button
            onClick={handleTriggerUpload}
            disabled={uploadProgress !== null}
            className={`inline-flex items-center gap-2 text-[13.5px] disabled:opacity-30 transition-all hover:translate-x-0.5 cursor-pointer select-none group py-2 px-1 mt-1 ${
              filesContrast.isLight
                ? 'text-zinc-800/80 hover:text-black'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {uploadProgress !== null ? (
              <Loader2 className={`w-4 h-4 animate-spin ${filesContrast.isLight ? 'text-zinc-800' : 'text-white/70'}`} />
            ) : (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors border ${
                filesContrast.isLight 
                  ? 'border-black/25 text-zinc-800 group-hover:border-black group-hover:bg-black/5' 
                  : 'border-white/30 text-white/70 group-hover:border-white group-hover:bg-white/10'
              }`}>
                ＋
              </span>
            )}
            <span className="font-normal drop-shadow-sm">
              {files.length === 0 ? 'Upload your first file' : 'Upload file'}
            </span>
            <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono ${
              filesContrast.isLight ? 'bg-black/[0.08] text-zinc-800' : 'bg-white/[0.10] text-white/50'
            }`}>
              O
            </kbd>
          </button>
        </div>
      </div>

      {/* ========================================================
          05 — NON-INTRUSIVE BOTTOM FLOATING TOASTS
          Zero screen-dimming black shrouds!
          ======================================================== */}

      {/* Undo Task Deletion Toast */}
      {undoTodo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/85 border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-fade-in">
          <span className="text-xs sm:text-sm font-medium tracking-wide">Task deleted</span>
          <button
            onClick={handleUndoDelete}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {/* Non-intrusive File Deletion Confirmation Bar (Wallpaper remains 100% visible) */}
      {deletingFile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/85 border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-modal-in max-w-[90vw]">
          <span className="text-xs sm:text-sm font-normal truncate max-w-[200px]">
            Delete <span className="font-semibold">{deletingFile.name}</span>?
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setDeletingFile(null)}
              className="px-2.5 py-1 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const f = deletingFile;
                setDeletingFile(null);
                await onDeleteFile(block.id, f);
              }}
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-colors cursor-pointer active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Reusable File Viewer */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          allFiles={files}
          onSelectFile={(f) => setViewingFile(f)}
          onClose={() => setViewingFile(null)}
          onDownload={onDownloadFile}
        />
      )}
    </>
  );
}
