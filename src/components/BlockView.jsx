import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import TodoItem from './TodoItem';
import FileTile from './FileTile';
import ContextMenu from './ContextMenu';
import EditTodoModal from './EditTodoModal';
import ConfirmModal from './ConfirmModal';
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
  const workspaceRef = useRef(null);
  const contrast = useAdaptiveContrast(workspaceRef, wallpaper);
  const isLight = contrast.isLight;

  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const todoInputRef = useRef(null);

  // Selected task & Long-press Delete key tracking
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteHoldFrameRef = useRef(null);
  const deleteHoldStartRef = useRef(0);

  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [activeTodo, setActiveTodo] = useState(null);

  const [editingTodo, setEditingTodo] = useState(null);
  const [deletingTodo, setDeletingTodo] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

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

  // Keyboard Navigation: Esc -> Home, N -> Add Task, O -> Upload, Hold Del -> Delete Task
  useEffect(() => {
    const isInputActive = () => {
      const el = document.activeElement;
      if (!el) return false;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
    };

    const handleKeyDown = (e) => {
      // Ignore if user is actively typing in an input
      if (isInputActive()) {
        if (e.key === 'Escape' && isAddingTodo) {
          setIsAddingTodo(false);
          setNewTodoTitle('');
        }
        return;
      }

      // Esc -> Back to Home
      if (e.key === 'Escape') {
        if (viewingFile) {
          setViewingFile(null);
          return;
        }
        if (editingTodo) {
          setEditingTodo(null);
          return;
        }
        if (deletingTodo) {
          setDeletingTodo(null);
          return;
        }
        if (deletingFile) {
          setDeletingFile(null);
          return;
        }
        if (contextMenuPos) {
          setContextMenuPos(null);
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

      // N or Right Shift + N -> Add Task
      if (e.code === 'KeyN') {
        e.preventDefault();
        setIsAddingTodo(true);
        return;
      }

      // O or Right Shift + O -> Upload File
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
          const HOLD_TIME = 650; // ms required hold duration

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
                onDeleteTodo(block.id, todoToDelete.id);
              }
            }
          };

          deleteHoldFrameRef.current = requestAnimationFrame(step);
        }
      }

      // Arrow navigation
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
    editingTodo,
    deletingTodo,
    deletingFile,
    contextMenuPos,
    onBack,
    onDeleteTodo
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

  const handleOpenContextMenu = (pos, todo) => {
    setActiveTodo(todo);
    setContextMenuPos(pos);
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setUploadingFileName(file.name);
    setUploadProgress(0);

    try {
      await onUploadFile(block.id, file, (progress) => {
        setUploadProgress(progress);
      });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploadProgress(null);
      setUploadingFileName('');
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div 
      ref={workspaceRef}
      className="w-[calc(100vw-32px)] sm:w-[min(860px,calc(100vw-64px))] mx-auto pt-[84px] sm:pt-[96px] pb-28 animate-page-in select-none transition-colors duration-300"
    >
      {/* ========================================================
          03 — HEADER (Back button, 32px Title, 13px Metadata)
          ======================================================== */}
      <div>
        {/* Back Button: 36x36px circular, adaptive contrast */}
        <button
          onClick={onBack}
          title="Back to Blocks (Esc)"
          aria-label="Back to Blocks"
          className={`w-9 h-9 rounded-full active:scale-95 transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none shadow-md backdrop-blur-md ${
            isLight
              ? 'bg-white/60 hover:bg-white/85 border border-black/15 text-zinc-900 hover:text-black focus-visible:ring-1 focus-visible:ring-black/40'
              : 'bg-black/35 hover:bg-black/60 border border-white/15 text-white/80 hover:text-white focus-visible:ring-1 focus-visible:ring-white/40'
          }`}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
        </button>

        {/* Title & Metadata with Adaptive Color & Halo */}
        <div className="mt-6">
          <h1 
            className={`text-[32px] font-semibold tracking-tight leading-tight break-words select-text transition-colors duration-300 ${
              isLight
                ? 'text-zinc-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.85)]'
                : 'text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]'
            }`}
          >
            {block.name}
          </h1>
          <p 
            className={`text-[13px] font-normal tracking-wide mt-1 transition-colors duration-300 ${
              isLight
                ? 'text-zinc-800/80 drop-shadow-[0_1px_4px_rgba(255,255,255,0.7)]'
                : 'text-white/60 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
            }`}
          >
            {todos.length} {todos.length === 1 ? 'task' : 'tasks'} · {files.length} {files.length === 1 ? 'file' : 'files'}
          </p>
        </div>
      </div>

      {/* ========================================================
          16 — SECTION SPACING: Header ↓ 48px to TODO
          ======================================================== */}
      <div className="mt-12">
        {/* TODO Section Header */}
        <div className="flex items-center justify-between">
          <span 
            className={`text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors duration-300 ${
              isLight ? 'text-zinc-800/75' : 'text-white/50'
            }`}
          >
            TODO
          </span>
          <span 
            className={`text-[12px] font-medium tracking-wider font-mono transition-colors duration-300 ${
              isLight ? 'text-zinc-700/65' : 'text-white/40'
            }`}
          >
            {completedCount} / {todos.length}
          </span>
        </div>

        {/* Subtle Separator: ↓ 14px to Task list */}
        <div 
          className={`w-full h-px mt-2 mb-3.5 transition-colors duration-300 ${
            isLight ? 'bg-black/[0.12]' : 'bg-white/[0.08]'
          }`} 
        />

        {/* Loading State */}
        {loadingTodos && (
          <div className={`py-4 text-xs tracking-wider ${isLight ? 'text-zinc-700/60' : 'text-white/40'}`}>
            Loading tasks...
          </div>
        )}

        {/* Task List: ONE Cohesive Container */}
        {!loadingTodos && todos.length > 0 && (
          <div 
            className={`rounded-[14px] overflow-hidden mb-3 transition-colors duration-300 ${
              isLight
                ? 'bg-white/45 backdrop-blur-xl border border-black/10 divide-y divide-black/[0.07] shadow-lg'
                : 'smoked-container divide-y divide-white/[0.06]'
            }`}
          >
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isSelected={todo.id === selectedTodoId}
                deleteProgress={todo.id === selectedTodoId ? deleteProgress : 0}
                onSelect={(t) => setSelectedTodoId(t.id)}
                onToggle={(t) => onToggleTodo(block.id, t.id, !t.completed)}
                onOpenContextMenu={handleOpenContextMenu}
                isLightMode={isLight}
              />
            ))}
          </div>
        )}

        {/* Empty State: No tasks yet */}
        {!loadingTodos && todos.length === 0 && !isAddingTodo && (
          <div className="py-2.5 mb-2">
            <p className={`text-[14px] ${isLight ? 'text-zinc-700/65' : 'text-white/40'}`}>
              No tasks yet
            </p>
          </div>
        )}

        {/* Inline Add Task Form OR Trigger */}
        {isAddingTodo ? (
          <form 
            onSubmit={handleCreateTodo} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all ${
              isLight
                ? 'bg-white/60 border border-black/15 shadow-sm'
                : 'smoked-container border border-white/[0.14]'
            }`}
          >
            <input
              ref={todoInputRef}
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={handleTodoInputKeyDown}
              placeholder="What needs to be done?"
              className={`flex-1 bg-transparent text-[15px] focus:outline-none ${
                isLight
                  ? 'text-zinc-950 placeholder-zinc-600/50'
                  : 'text-white placeholder-white/35'
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
                className={`px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                  isLight ? 'text-zinc-700 hover:text-black' : 'text-white/45 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTodoTitle.trim()}
                className={`px-3.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-30 transition-all cursor-pointer shadow-sm active:scale-95 ${
                  isLight
                    ? 'bg-zinc-900 text-white hover:bg-black'
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
            className={`inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] transition-all hover:translate-x-0.5 cursor-pointer select-none group py-1 ${
              isLight
                ? 'text-zinc-800/80 hover:text-black'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span className={`text-base leading-none transition-colors ${
              isLight ? 'text-zinc-700/60 group-hover:text-black' : 'text-white/40 group-hover:text-white'
            }`}>
              ＋
            </span>
            <span className="font-normal">
              {todos.length === 0 ? 'Add your first task' : 'Add task'}
            </span>
            <kbd className={`hidden sm:inline-block ml-1 px-1 py-0.2 rounded text-[10px] font-mono ${
              isLight ? 'bg-black/[0.08] text-zinc-800' : 'bg-white/[0.07] text-white/40'
            }`}>
              N
            </kbd>
          </button>
        )}
      </div>

      {/* ========================================================
          16 — SECTION SPACING: Add task ↓ 56px to FILES
          ======================================================== */}
      <div className="mt-14">
        {/* FILES Section Header */}
        <div className="flex items-center justify-between">
          <span 
            className={`text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors duration-300 ${
              isLight ? 'text-zinc-800/75' : 'text-white/50'
            }`}
          >
            FILES
          </span>
          <span 
            className={`text-[12px] font-medium tracking-wider font-mono transition-colors duration-300 ${
              isLight ? 'text-zinc-700/65' : 'text-white/40'
            }`}
          >
            {files.length}
          </span>
        </div>

        {/* Subtle Separator: ↓ 14px to File list */}
        <div 
          className={`w-full h-px mt-2 mb-3.5 transition-colors duration-300 ${
            isLight ? 'bg-black/[0.12]' : 'bg-white/[0.08]'
          }`} 
        />

        {/* Loading Files */}
        {loadingFiles && (
          <div className={`py-4 text-xs tracking-wider ${isLight ? 'text-zinc-700/60' : 'text-white/40'}`}>
            Loading files...
          </div>
        )}

        {/* Upload Progress Bar Card */}
        {uploadProgress !== null && (
          <div className={`mb-3 p-4 rounded-[14px] border ${
            isLight 
              ? 'bg-white/60 border-black/10 shadow-sm' 
              : 'smoked-container border-white/15'
          }`}>
            <div className={`flex items-center justify-between text-xs mb-2 ${
              isLight ? 'text-zinc-900' : 'text-white/80'
            }`}>
              <span className="truncate max-w-[260px]">Uploading {uploadingFileName}...</span>
              <span className={`font-mono ${isLight ? 'text-zinc-700' : 'text-white/50'}`}>
                {uploadProgress}%
              </span>
            </div>
            <div className={`w-full h-1 rounded-full overflow-hidden ${isLight ? 'bg-black/10' : 'bg-white/10'}`}>
              <div
                className={`h-full transition-all duration-150 ease-out rounded-full ${
                  isLight ? 'bg-zinc-950' : 'bg-white'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* File Visual Grid (Zero permanent labels, pure media tiles) */}
        {!loadingFiles && files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5 mb-3">
            {files.map((file) => (
              <FileTile
                key={file.id}
                file={file}
                onOpenViewer={(f) => setViewingFile(f)}
                onDownload={onDownloadFile}
                onRequestDelete={(f) => setDeletingFile(f)}
                isLightMode={isLight}
              />
            ))}
          </div>
        )}

        {/* Empty State: No files yet */}
        {!loadingFiles && files.length === 0 && uploadProgress === null && (
          <div className="py-2.5 mb-2">
            <p className={`text-[14px] ${isLight ? 'text-zinc-700/65' : 'text-white/40'}`}>
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

        {/* Upload File Trigger Button */}
        <button
          onClick={handleTriggerUpload}
          disabled={uploadProgress !== null}
          className={`inline-flex items-center gap-1.5 text-[13px] sm:text-[14px] disabled:opacity-30 transition-all hover:translate-x-0.5 cursor-pointer select-none group py-1 ${
            isLight
              ? 'text-zinc-800/80 hover:text-black'
              : 'text-white/50 hover:text-white'
          }`}
        >
          {uploadProgress !== null ? (
            <Loader2 className={`w-3.5 h-3.5 animate-spin mr-1 ${isLight ? 'text-zinc-800' : 'text-white/60'}`} />
          ) : (
            <span className={`text-base leading-none transition-colors ${
              isLight ? 'text-zinc-700/60 group-hover:text-black' : 'text-white/40 group-hover:text-white'
            }`}>
              ＋
            </span>
          )}
          <span className="font-normal">
            {files.length === 0 ? 'Upload your first file' : 'Upload file'}
          </span>
          <kbd className={`hidden sm:inline-block ml-1 px-1 py-0.2 rounded text-[10px] font-mono ${
            isLight ? 'bg-black/[0.08] text-zinc-800' : 'bg-white/[0.07] text-white/40'
          }`}>
            O
          </kbd>
        </button>
      </div>

      {/* ========================================================
          CONTEXT MENU & MODALS
          ======================================================== */}
      {/* Context Menu for Task */}
      {contextMenuPos && (
        <ContextMenu
          position={contextMenuPos}
          onEdit={() => {
            if (activeTodo) setEditingTodo(activeTodo);
          }}
          onDelete={() => {
            if (activeTodo) setDeletingTodo(activeTodo);
          }}
          onClose={() => setContextMenuPos(null)}
        />
      )}

      {/* Edit Todo Modal */}
      <EditTodoModal
        isOpen={Boolean(editingTodo)}
        todo={editingTodo}
        onClose={() => setEditingTodo(null)}
        onSave={async (todoId, newTitle) => {
          await onUpdateTodo(block.id, todoId, { title: newTitle });
          setEditingTodo(null);
        }}
      />

      {/* Delete Todo Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTodo)}
        title="Delete this task?"
        onClose={() => setDeletingTodo(null)}
        onConfirm={async () => {
          if (deletingTodo) {
            await onDeleteTodo(block.id, deletingTodo.id);
            setDeletingTodo(null);
          }
        }}
        confirmLabel="Delete"
        isDanger={true}
      />

      {/* Delete File Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingFile)}
        title="Delete this file?"
        onClose={() => setDeletingFile(null)}
        onConfirm={async () => {
          if (deletingFile) {
            await onDeleteFile(block.id, deletingFile);
            setDeletingFile(null);
          }
        }}
        confirmLabel="Delete"
        isDanger={true}
      />

      {/* Full-Screen Reusable File Viewer with Next/Prev and Zoom/Pan */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          allFiles={files}
          onSelectFile={(f) => setViewingFile(f)}
          onClose={() => setViewingFile(null)}
          onDownload={onDownloadFile}
        />
      )}
    </div>
  );
}