import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Loader2, 
  Box, 
  CheckCircle2, 
  Layers, 
  Paperclip, 
  Plus, 
  Pencil, 
  Check, 
  X,
  Sparkles
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
  const subBlocksInThisBlock = todos.filter((t) => t.isSubBlock && t.subBlockId);
  const completionPercentage = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  const isAllDone = todos.length > 0 && completedCount === todos.length;
  const isPartDone = todos.length > 0 && completedCount > 0 && completedCount < todos.length;
  const isNothingDone = todos.length > 0 && completedCount === 0;

  const barColor = isAllDone
    ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
    : isPartDone
      ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
      : isNothingDone
        ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
        : (isLight ? 'bg-black/20' : 'bg-white/20');

  return (
    <>
      {/* ========================================================
          01 — TOP FLOATING NAVIGATION & BREADCRUMBS BAR
          ======================================================== */}
      <div className="fixed top-3.5 left-4 sm:top-5 sm:left-6 z-20 flex items-center gap-2 max-w-[calc(100vw-180px)] overflow-x-auto no-scrollbar py-1">
        {/* Back Button */}
        <button
          onClick={onBack}
          title="Go Back (Esc)"
          aria-label="Back"
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 shadow-lg backdrop-blur-xl border flex-shrink-0 ${
            isLight
              ? 'bg-white/70 hover:bg-white/90 border-black/15 text-zinc-900 shadow-sm'
              : 'bg-black/50 hover:bg-black/70 border-white/20 text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Breadcrumb Trail */}
        <nav 
          aria-label="Breadcrumb"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-lg text-xs font-medium transition-all ${
            isLight
              ? 'bg-white/70 border-black/10 text-zinc-700 shadow-sm'
              : 'bg-black/50 border-white/15 text-white/80'
          }`}
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || 'home'}>
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                )}
                {isLast ? (
                  <span className={`font-semibold truncate max-w-[150px] ${
                    isLight ? 'text-zinc-950' : 'text-white'
                  }`}>
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (crumb.id === null) {
                        onBack();
                      } else {
                        onNavigateBlock(crumb.id);
                      }
                    }}
                    className={`hover:underline cursor-pointer truncate max-w-[120px] transition-colors ${
                      isLight ? 'hover:text-black' : 'hover:text-white'
                    }`}
                  >
                    {crumb.name}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* ========================================================
          02 — MAIN INNER BLOCK CONTAINER
          Upgraded smoked glass cards, beautiful typography
          ======================================================== */}
      <div 
        ref={containerRef}
        className="w-full max-w-[780px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-32 animate-page-in select-none"
      >
        {/* HERO BLOCK HEADER CARD */}
        <div className={`p-5 sm:p-7 rounded-3xl backdrop-blur-2xl border transition-all duration-300 shadow-2xl mb-8 relative overflow-hidden ${
          isLight
            ? 'bg-white/60 border-black/10 shadow-[0_12px_36px_rgba(0,0,0,0.08)]'
            : 'bg-black/45 border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.55)]'
        }`}>
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Top Metadata Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${
                nestingLevel > 1
                  ? isLight
                    ? 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                    : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                  : isLight
                    ? 'bg-black/5 text-zinc-800 border-black/10'
                    : 'bg-white/10 text-white/90 border-white/15'
              }`}>
                {nestingLevel > 1 ? (
                  <>
                    <Box className="w-3 h-3 stroke-[2.2]" />
                    <span>Sub-Block • Level {nestingLevel}</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3 h-3 stroke-[2.2]" />
                    <span>Active Block</span>
                  </>
                )}
              </span>

              {subBlocksInThisBlock.length > 0 && (
                <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                  isLight
                    ? 'bg-purple-500/10 text-purple-800 border-purple-500/20'
                    : 'bg-purple-400/15 text-purple-300 border-purple-400/30'
                }`}>
                  <Box className="w-3 h-3" />
                  <span>{subBlocksInThisBlock.length} Nested</span>
                </span>
              )}
            </div>

            {/* Edit Title Button */}
            {!isEditingTitle && (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                title="Edit Block Name"
                className={`p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-all cursor-pointer ${
                  isLight ? 'hover:bg-black/5 text-zinc-700' : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Editable Block Title */}
          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-2 mb-4">
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
                className={`flex-1 text-2xl sm:text-3xl font-bold tracking-tight px-3 py-1.5 rounded-xl border focus:outline-none ${
                  isLight
                    ? 'bg-white/80 border-black/20 text-zinc-950 focus:border-black/40'
                    : 'bg-black/60 border-white/25 text-white focus:border-white/50'
                }`}
              />
              <button
                type="submit"
                className={`p-2 rounded-xl text-emerald-400 hover:bg-white/10 transition-colors cursor-pointer`}
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingTitle(false);
                  setEditedTitle(block.name || '');
                }}
                className={`p-2 rounded-xl text-white/50 hover:bg-white/10 transition-colors cursor-pointer`}
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>
          ) : (
            <h1 
              onDoubleClick={() => setIsEditingTitle(true)}
              className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight break-words mb-5 transition-colors cursor-pointer ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}
            >
              {block.name}
            </h1>
          )}

          {/* Integrated Progress Bar & Stats Console */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 font-mono font-semibold ${
                  isAllDone
                    ? 'text-emerald-400'
                    : isPartDone
                      ? 'text-amber-400'
                      : isLight ? 'text-rose-600' : 'text-rose-400'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                  {completedCount} of {todos.length} Done
                </span>
                {todos.length > 0 && (
                  <span className={`text-[11px] font-mono opacity-60 ${
                    isLight ? 'text-zinc-700' : 'text-white'
                  }`}>
                    • {completionPercentage}%
                  </span>
                )}
              </div>

              <span className={`text-[11px] font-mono tracking-wider uppercase font-semibold ${
                isAllDone
                  ? 'text-emerald-400'
                  : isPartDone
                    ? 'text-amber-300'
                    : (isLight ? 'text-zinc-600' : 'text-white/40')
              }`}>
                {isAllDone ? '● Completed' : isPartDone ? '● In Progress' : '● Not Started'}
              </span>
            </div>

            {/* Glowing Multi-Color Progress Track */}
            <div className={`w-full h-2 rounded-full overflow-hidden ${
              isLight ? 'bg-black/10' : 'bg-white/10'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{
                  width: `${
                    todos.length === 0 
                      ? 0 
                      : isNothingDone 
                        ? 6 
                        : completionPercentage
                  }%`
                }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            03 — TASKS SECTION WITH 3-SECOND LONG PRESS TO SUB-BLOCK
            ======================================================== */}
        <div className="mb-10 sm:mb-12">
          {/* Section Heading & Helper Hint */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tracking-[0.16em] uppercase ${
                isLight ? 'text-zinc-800' : 'text-white/80'
              }`}>
                TASKS & SUB-BLOCKS
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-black/5 text-zinc-700' : 'bg-white/10 text-white/70'
              }`}>
                {todos.length}
              </span>
            </div>

            {/* Helpful Feature Hint */}
            <div className={`hidden sm:flex items-center gap-1.5 text-[11px] font-medium ${
              isLight ? 'text-amber-800/80' : 'text-amber-300/80'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Hold any task 3s to turn into a Sub-Block</span>
            </div>
          </div>

          {/* Loading Tasks State */}
          {loadingTodos && (
            <div className={`py-4 text-xs tracking-wider px-2 ${isLight ? 'text-zinc-600' : 'text-white/40'}`}>
              Loading tasks...
            </div>
          )}

          {/* Task Items List */}
          {!loadingTodos && todos.length > 0 && (
            <div className="flex flex-col gap-2 sm:gap-2.5 mb-3">
              {todos.map((todo) => {
                // Calculate nested task count for sub-block badge
                const subBlockTasks = todo.isSubBlock && todo.subBlockId
                  ? allTodos.filter((t) => t.blockId === todo.subBlockId)
                  : [];

                return (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    wallpaper={wallpaper}
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

          {/* Empty State */}
          {!loadingTodos && todos.length === 0 && !isAddingTodo && (
            <div className={`py-8 text-center rounded-2xl border mb-3 backdrop-blur-md ${
              isLight ? 'bg-white/30 border-black/10' : 'bg-black/20 border-white/10'
            }`}>
              <Box className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className={`text-sm font-medium ${isLight ? 'text-zinc-700' : 'text-white/70'}`}>
                No tasks in this block yet
              </p>
              <p className={`text-xs mt-1 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>
                Click "Add task" below or press <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded">N</kbd> to get started
              </p>
            </div>
          )}

          {/* Inline Add Task Input Card */}
          {isAddingTodo ? (
            <form 
              onSubmit={handleCreateTodo} 
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-150 backdrop-blur-xl border shadow-xl ${
                isLight
                  ? 'bg-white/85 border-black/20 shadow-md'
                  : 'bg-black/60 border-white/25 shadow-2xl'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border border-dashed flex-shrink-0 ${
                isLight ? 'border-black/40' : 'border-white/40'
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
                placeholder="What needs to be done in this block?"
                className={`flex-1 bg-transparent text-[15px] focus:outline-none ${
                  isLight
                    ? 'text-zinc-950 placeholder-zinc-500'
                    : 'text-white placeholder-white/40'
                }`}
                maxLength={140}
              />
              <div className="flex items-center gap-2 flex-shrink-0">
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
                  Add Task
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTodo(true)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-3 px-4 rounded-2xl border border-dashed transition-all duration-200 cursor-pointer select-none group backdrop-blur-md ${
                isLight
                  ? 'bg-white/30 hover:bg-white/60 border-black/20 text-zinc-800 hover:border-black/40'
                  : 'bg-black/20 hover:bg-black/40 border-white/20 text-white/80 hover:border-white/40'
              }`}
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>{todos.length === 0 ? 'Add your first task' : 'Add task'}</span>
              <kbd className={`hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                isLight ? 'bg-black/10 text-zinc-800' : 'bg-white/10 text-white/70'
              }`}>
                N
              </kbd>
            </button>
          )}
        </div>

        {/* ========================================================
            04 — FILES & ATTACHMENTS SECTION
            ======================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1 mt-10 sm:mt-12">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold tracking-[0.16em] uppercase ${
                isLight ? 'text-zinc-800' : 'text-white/80'
              }`}>
                FILES & ATTACHMENTS
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                isLight ? 'bg-black/5 text-zinc-700' : 'bg-white/10 text-white/70'
              }`}>
                {files.length}
              </span>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadProgress !== null}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer active:scale-95 border ${
                isLight
                  ? 'bg-white/70 hover:bg-white border-black/10 text-zinc-900 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-xs'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload File</span>
              <kbd className="hidden sm:inline-block ml-1 text-[10px] font-mono opacity-60">O</kbd>
            </button>
          </div>

          {/* Loading Files */}
          {loadingFiles && (
            <div className={`py-3 text-xs tracking-wider px-1 ${isLight ? 'text-zinc-600' : 'text-white/40'}`}>
              Loading files...
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className={`mb-3 p-3.5 rounded-2xl border backdrop-blur-xl ${
              isLight 
                ? 'bg-white/70 border-black/15 shadow-sm' 
                : 'bg-black/50 border-white/20'
            }`}>
              <div className={`flex items-center justify-between text-xs mb-2 ${
                isLight ? 'text-zinc-900 font-medium' : 'text-white/90 font-medium'
              }`}>
                <span className="truncate max-w-[260px]">Uploading {uploadingFileName}...</span>
                <span className="font-mono text-amber-400 font-semibold">{uploadProgress}%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-black/10' : 'bg-white/15'}`}>
                <div
                  className="h-full bg-amber-400 transition-all duration-150 ease-out rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Files Grid */}
          {!loadingFiles && files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-3">
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

          {/* Empty State */}
          {!loadingFiles && files.length === 0 && uploadProgress === null && (
            <div className={`py-6 text-center rounded-2xl border mb-2 backdrop-blur-md ${
              isLight ? 'bg-white/30 border-black/10' : 'bg-black/20 border-white/10'
            }`}>
              <Paperclip className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
              <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-white/50'}`}>
                No files uploaded to this block
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
