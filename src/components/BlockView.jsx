import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Pencil, 
  Check, 
  X,
  Files as FilesIcon
} from 'lucide-react';
import TodoItem from './TodoItem';
import FileTile from './FileTile';
import FileViewer from './FileViewer';
import { useAdaptiveContrast } from '../hooks/useAdaptiveContrast';

export default function BlockView({
  block,
  allBlocks = [],
  allTodos = [],
  todos = [],
  files = [],
  loadingTodos = false,
  loadingFiles = false,
  wallpaper,
  onBack,
  onNavigateBlock,
  onUpdateBlock,
  onAddTodo,
  onToggleTodo,
  onUpdateTodo,
  onDeleteTodo,
  onConvertToSubBlock,
  onUploadFile,
  onDownloadFile,
  onDeleteFile
}) {
  const containerRef = useRef(null);
  const contrast = useAdaptiveContrast(containerRef, wallpaper);
  const isLight = contrast.isLight;

  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const todoInputRef = useRef(null);

  // Block title inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(block.name || '');
  const titleInputRef = useRef(null);

  useEffect(() => {
    setEditedTitle(block.name || '');
  }, [block.name]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Selected task & Long-press Delete key tracking (desktop power users)
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteHoldFrameRef = useRef(null);
  const deleteHoldStartRef = useRef(0);

  // Undo Toast for Task Deletion
  const [undoTodo, setUndoTodo] = useState(null);
  const undoTimerRef = useRef(null);

  // File viewing and deletion confirmation
  const [viewingFile, setViewingFile] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [lastFailedFile, setLastFailedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Breadcrumbs calculation (Home > Root Block > Sub-Block > Child Sub-Block)
  const breadcrumbs = useMemo(() => {
    const trail = [{ id: null, name: 'Home' }];
    if (!block) return trail;

    const ancestors = [];
    let curr = block;
    const visited = new Set();
    while (curr?.parentBlockId && !visited.has(curr.id)) {
      visited.add(curr.id);
      const parent = allBlocks.find((b) => b.id === curr.parentBlockId);
      if (!parent) break;
      ancestors.unshift(parent);
      curr = parent;
    }

    ancestors.forEach((a) => trail.push({ id: a.id, name: a.name }));
    trail.push({ id: block.id, name: block.name, isCurrent: true });
    return trail;
  }, [block, allBlocks]);

  const nestingLevel = breadcrumbs.length - 1; // 1 = Root block, 2 = Sub-block, etc.

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

  // Keyboard Shortcuts: Esc, N (add task), O (upload), Hold Del
  useEffect(() => {
    const isInputActive = () => {
      const el = document.activeElement;
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      if (isInputActive()) {
        if (e.key === 'Escape') {
          if (isAddingTodo) {
            setIsAddingTodo(false);
            setNewTodoTitle('');
          }
          if (isEditingTitle) {
            setIsEditingTitle(false);
            setEditedTitle(block.name || '');
          }
        }
        return;
      }

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
    block.name,
    todos,
    selectedTodoId,
    isAddingTodo,
    isEditingTitle,
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

  const handleSaveTitle = (e) => {
    e?.preventDefault();
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== block.name) {
      onUpdateBlock?.(block.id, { name: trimmed });
    }
    setIsEditingTitle(false);
  };

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setLastFailedFile(file);
    setUploadError(null);
    setUploadingFileName(file.name);
    setUploadProgress(20);

    try {
      await onUploadFile(block.id, file, (progress) => {
        setUploadProgress(progress);
      });
      setLastFailedFile(null);
      setUploadError(null);
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError('File upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        setUploadingFileName('');
      }, 350);
    }
  };

  const handleRetryUpload = async () => {
    if (!lastFailedFile) return;
    const file = lastFailedFile;
    setUploadError(null);
    setUploadingFileName(file.name);
    setUploadProgress(20);

    try {
      await onUploadFile(block.id, file, (progress) => {
        setUploadProgress(progress);
      });
      setLastFailedFile(null);
      setUploadError(null);
    } catch (err) {
      console.error('File upload retry failed:', err);
      setUploadError('File upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        setUploadingFileName('');
      }, 350);
    }
  };

  return (
    <>
      {/* ========================================================
          01 — TOP NAVIGATION: Home 🏠
          ======================================================== */}
      <div className="fixed top-3.5 left-4 sm:top-5 sm:left-6 z-20 flex items-center gap-2 max-w-[calc(100vw-180px)] overflow-x-auto no-scrollbar py-1">
        <button
          onClick={onBack}
          title="Home (Esc)"
          aria-label="Home"
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border shadow-sm transition-all duration-200 active:scale-95 text-xs font-medium cursor-pointer ${
            isLight
              ? 'bg-white/70 hover:bg-white/90 border-black/10 text-zinc-900 shadow-sm'
              : 'bg-black/50 hover:bg-black/70 border-white/20 text-white'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Home 🏠</span>
        </button>
        {breadcrumbs.length > 2 && (
          <div className="flex items-center gap-1.5">
            <span className={`text-xs opacity-40 ${isLight ? 'text-black' : 'text-white'}`}>/</span>
            <button
              onClick={() => onNavigateBlock(breadcrumbs[breadcrumbs.length - 2].id)}
              className={`text-xs font-medium hover:underline max-w-[140px] truncate ${
                isLight ? 'text-zinc-700' : 'text-white/80'
              }`}
            >
              {breadcrumbs[breadcrumbs.length - 2].name}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          02 — MAIN CONTAINER — calm, minimal spatial workspace
          ======================================================== */}
      <div 
        ref={containerRef}
        className="w-full max-w-[720px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-32 animate-page-in select-none"
      >
        {/* BLOCK NAME — large clean typography */}
        <div className="group relative mb-8">
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-2">
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                    setEditedTitle(block.name || '');
                  }
                }}
                className={`flex-1 text-3xl sm:text-4xl font-bold tracking-tight px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isLight
                    ? 'bg-white/60 border-black/15 text-zinc-950 focus:border-black/30'
                    : 'bg-black/40 border-white/20 text-white focus:border-white/40'
                }`}
              />
              <button
                type="submit"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'text-emerald-600 hover:bg-black/5' : 'text-emerald-400 hover:bg-white/10'
                }`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditedTitle(block.name || '');
                }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight ? 'text-zinc-500 hover:bg-black/5' : 'text-white/50 hover:bg-white/10'
                }`}
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>
          ) : (
            <div className="flex items-start gap-2">
              <h1 
                onDoubleClick={() => setIsEditingTitle(true)}
                className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight break-words cursor-pointer ${
                  isLight ? 'text-zinc-950' : 'text-white'
                }`}
                style={{
                  textShadow: isLight
                    ? '0 1px 4px rgba(255, 255, 255, 0.95), 0 0 2px rgba(255, 255, 255, 0.7)'
                    : '0 2px 14px rgba(0, 0, 0, 0.85), 0 1px 3px rgba(0, 0, 0, 0.7)'
                }}
              >
                {block.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                title="Edit block name"
                className={`mt-2 p-1 rounded-lg opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all cursor-pointer ${
                  isLight ? 'hover:bg-black/5 text-zinc-700' : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* TASKS */}
        <div className="mb-10">
          {loadingTodos && (
            <p className={`text-xs tracking-wider py-2 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Loading...</p>
          )}

          {!loadingTodos && todos.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-3">
              {todos.map((todo) => {
                // Calculate nested task count for sub-block badge
                const subBlockTasks = todo.isSubBlock && todo.subBlockId
                  ? allTodos.filter((t) => t.blockId === todo.subBlockId)
                  : [];

                return (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isLight={isLight}
                    isSelected={todo.id === selectedTodoId}
                    deleteProgress={todo.id === selectedTodoId ? deleteProgress : 0}
                    subBlockTaskCount={subBlockTasks.length}
                    onSelect={(t) => setSelectedTodoId(t.id)}
                    onToggle={(t) => onToggleTodo(block.id, t.id, !t.completed)}
                    onUpdate={(todoId, newTitle) => onUpdateTodo(block.id, todoId, { title: newTitle })}
                    onDelete={() => handleDeleteTask(todo)}
                    onConvertToBlock={(t) => onConvertToSubBlock(block.id, t)}
                    onOpenSubBlock={(subBlockId) => onNavigateBlock(subBlockId)}
                  />
                );
              })}
            </div>
          )}

          {!loadingTodos && todos.length === 0 && !isAddingTodo && (
            <p 
              className={`text-sm py-2 mb-2 ${isLight ? 'text-zinc-700' : 'text-white/50'}`}
              style={{ textShadow: isLight ? '0 1px 2px rgba(255, 255, 255, 0.85)' : '0 1px 4px rgba(0, 0, 0, 0.85)' }}
            >
              No tasks yet
            </p>
          )}

          {isAddingTodo ? (
            <form 
              onSubmit={handleCreateTodo} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border ${
                isLight
                  ? 'bg-white/60 border-black/10'
                  : 'bg-black/40 border-white/15'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full border border-dashed flex-shrink-0 ${
                isLight ? 'border-black/30' : 'border-white/30'
              }`} />
              <input
                ref={todoInputRef}
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTodo(e);
                  else if (e.key === 'Escape') {
                    setNewTodoTitle('');
                    setIsAddingTodo(false);
                  }
                }}
                placeholder="What needs to be done?"
                className={`flex-1 bg-transparent text-[15px] focus:outline-none ${
                  isLight
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
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    isLight ? 'text-zinc-700 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTodoTitle.trim()}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isLight
                      ? 'bg-zinc-950 text-white hover:bg-black'
                      : 'bg-white text-zinc-950 hover:bg-white/90'
                  }`}
                >
                  Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTodo(true)}
              className={`text-sm font-medium py-1.5 px-0.5 transition-all cursor-pointer ${
                isLight ? 'text-zinc-800 hover:text-black' : 'text-white/60 hover:text-white'
              }`}
              style={{ textShadow: isLight ? '0 1px 2px rgba(255, 255, 255, 0.85)' : '0 1px 4px rgba(0, 0, 0, 0.85)' }}
            >
              + Add task
            </button>
          )}
        </div>

        {/* FILES */}
        <div>
          <div 
            className={`inline-flex items-center gap-1.5 mb-3 ${
              isLight ? 'text-zinc-800' : 'text-white/60'
            }`}
            style={{
              filter: isLight 
                ? 'drop-shadow(0 1px 2px rgba(255, 255, 255, 0.85))' 
                : 'drop-shadow(0 1px 4px rgba(0, 0, 0, 0.85))'
            }}
            title="Files"
            aria-label="Files"
          >
            <FilesIcon className="w-4 h-4 stroke-[2]" />
          </div>

          {loadingFiles && (
            <p className={`text-xs tracking-wider py-2 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Loading...</p>
          )}

          {/* Upload Progress — simple thin bar */}
          {uploadProgress !== null && (
            <div className="mb-3 max-w-sm">
              <div className={`flex items-center justify-between text-xs mb-1 ${
                isLight ? 'text-zinc-600' : 'text-white/60'
              }`}>
                <span className="truncate max-w-[240px]">{uploadingFileName}</span>
                <span className="font-mono text-xs">{uploadProgress}%</span>
              </div>
              <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
                <div
                  className="h-full bg-amber-400 transition-all duration-150 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Clear Upload Error Alert if upload failed */}
          {uploadError && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2 mb-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs backdrop-blur-md animate-fade-in max-w-md">
              <span className="truncate">{uploadError}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {lastFailedFile && (
                  <button
                    onClick={handleRetryUpload}
                    className="font-semibold underline hover:text-white cursor-pointer"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => setUploadError(null)}
                  className="opacity-70 hover:opacity-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {!loadingFiles && files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-3">
              {files.map((file) => (
                <FileTile
                  key={file.id || file.fileId}
                  file={file}
                  onOpenViewer={(f) => setViewingFile(f)}
                  onDownload={onDownloadFile}
                  onRequestDelete={(f) => setDeletingFile(f)}
                  isLightMode={isLight}
                />
              ))}
            </div>
          )}

          {/* Add file trigger — minimal text */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
            className={`text-sm font-medium py-2 px-1 transition-all cursor-pointer ${
              isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-white/40 hover:text-white/70'
            }`}
          >
            + Add file
          </button>

          {/* Hidden Native File Input supporting all file types */}
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* ========================================================
          05 — BOTTOM FLOATING TOASTS & MODALS
          ======================================================== */}

      {/* Undo Task Deletion Toast */}
      {undoTodo && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/90 border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-fade-in">
          <span className="text-xs sm:text-sm font-medium tracking-wide">Task deleted</span>
          <button
            onClick={handleUndoDelete}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {/* Non-intrusive File Deletion Confirmation Bar */}
      {deletingFile && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/90 border border-white/20 text-white shadow-2xl backdrop-blur-xl animate-modal-in max-w-[90vw]">
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
