// Unified Storage & Realtime Database Synchronization Engine for LIFE OF BLOCKS
// Architecture:
// Authenticated: Firebase Realtime Database (RTDB) is the Single Source of Truth.
// LocalStorage is used ONLY as a temporary offline read-cache (scoped to UID).
// Guest: Scoped to guest localStorage.

import { 
  getCurrentUser, 
  subscribeAuth, 
  subscribeRTDBBlocks, 
  setRTDBBlock, 
  removeRTDBBlock, 
  subscribeRTDBTodos, 
  setRTDBTodo, 
  updateRTDBTodo, 
  removeRTDBTodo, 
  subscribeRTDBFiles, 
  setRTDBFile, 
  removeRTDBFile, 
  uploadFileToCloud, 
  deleteFileFromCloud,
  readFileAsOptimizedDataURL 
} from './firebase';

const STORAGE_EVENT = 'lob_storage_update';
const SYNC_STATUS_EVENT = 'lob_sync_status_update';

// ----------------- SYNC STATUS STATE -----------------
let syncState = {
  status: 'syncing', // 'synced' | 'syncing' | 'permission_denied' | 'error' | 'offline'
  message: '',
  lastSyncedAt: Date.now()
};

export function getSyncStatus() {
  return { ...syncState };
}

function updateSyncStatus(status, message = '') {
  syncState = {
    status,
    message,
    lastSyncedAt: status === 'synced' ? Date.now() : syncState.lastSyncedAt
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: syncState }));
  }
}

export function subscribeSyncStatus(callback) {
  const handler = (e) => callback(e?.detail || getSyncStatus());
  window.addEventListener(SYNC_STATUS_EVENT, handler);
  callback(getSyncStatus());
  return () => {
    window.removeEventListener(SYNC_STATUS_EVENT, handler);
  };
}

function notifyChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

// ----------------- IN-MEMORY STORE -----------------
let currentBlocks = [];
let currentTodos = [];
let currentFiles = [];
let activeUid = null;
let activeUnsubscribes = [];

// Helper to get user-scoped cache key
function getCacheKey(type, uid) {
  return uid ? `lob_cache_${uid}_${type}` : `lob_guest_${type}`;
}

function loadCache(uid) {
  try {
    const blocksKey = getCacheKey('blocks', uid);
    const todosKey = getCacheKey('todos', uid);
    const filesKey = getCacheKey('files', uid);

    const b = localStorage.getItem(blocksKey);
    const t = localStorage.getItem(todosKey);
    const f = localStorage.getItem(filesKey);

    currentBlocks = b ? JSON.parse(b) : [];
    currentTodos = t ? JSON.parse(t) : [];
    currentFiles = f ? JSON.parse(f) : [];
  } catch (err) {
    console.warn('Cache load warning:', err);
  }
}

function persistCache(uid) {
  try {
    const blocksKey = getCacheKey('blocks', uid);
    const todosKey = getCacheKey('todos', uid);
    const filesKey = getCacheKey('files', uid);

    localStorage.setItem(blocksKey, JSON.stringify(currentBlocks));
    localStorage.setItem(todosKey, JSON.stringify(currentTodos));
    localStorage.setItem(filesKey, JSON.stringify(currentFiles));
  } catch (err) {
    console.warn('Cache save warning:', err);
  }
}

// ----------------- LOCAL BLOB STORAGE (IndexedDB) -----------------
const DB_NAME = 'LOB_Files_DB';
const DB_VERSION = 1;
const STORE_NAME = 'files_blobs';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileBlob(id, file) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id, blob: file });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.debug('Local blob save notice:', e);
  }
}

export async function getFileBlob(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.blob : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteFileBlob(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

export async function getFileObjectUrl(id) {
  const meta = getFilesMeta().find(f => f.id === id || f.fileId === id);
  if (meta && meta.downloadURL) {
    return meta.downloadURL;
  }

  const blob = await getFileBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function getFileContent(id, format = 'text') {
  const meta = getFilesMeta().find(f => f.id === id || f.fileId === id);
  if (meta && meta.downloadURL) {
    try {
      const res = await fetch(meta.downloadURL);
      if (format === 'arrayBuffer') return await res.arrayBuffer();
      return await res.text();
    } catch (e) {
      console.debug('Fetch from cloud URL failed, trying local blob:', e);
    }
  }

  const blob = await getFileBlob(id);
  if (!blob) return null;
  if (format === 'arrayBuffer') {
    return await blob.arrayBuffer();
  }
  return await blob.text();
}

// ----------------- DATA MIGRATION ENGINE -----------------
/**
 * Safely migrates existing un-scoped blocks and tasks (e.g., created before login)
 * directly into the authenticated user's Firebase RTDB.
 */
async function migrateExistingDataToCloud(uid) {
  if (!uid) return;
  try {
    // 1. Inspect legacy un-scoped localStorage keys
    const legacyBlocksRaw = localStorage.getItem('lob_blocks');
    const legacyTodosRaw = localStorage.getItem('lob_todos');
    const legacyFilesRaw = localStorage.getItem('lob_files_meta');

    const legacyBlocks = legacyBlocksRaw ? JSON.parse(legacyBlocksRaw) : [];
    const legacyTodos = legacyTodosRaw ? JSON.parse(legacyTodosRaw) : [];
    const legacyFiles = legacyFilesRaw ? JSON.parse(legacyFilesRaw) : [];

    if (legacyBlocks.length === 0 && legacyTodos.length === 0 && legacyFiles.length === 0) {
      return;
    }

    console.log(`[LifeOfBlocks Migration] Migrating ${legacyBlocks.length} blocks to account ${uid}...`);

    for (const block of legacyBlocks) {
      if (block?.id && block?.name) {
        await setRTDBBlock(uid, {
          id: block.id,
          name: block.name,
          createdAt: block.createdAt || Date.now(),
          updatedAt: block.updatedAt || Date.now()
        }).catch(() => {});
      }
    }

    for (const todo of legacyTodos) {
      if (todo?.id && todo?.title) {
        await setRTDBTodo(uid, {
          id: todo.id,
          blockId: todo.blockId,
          title: todo.title,
          completed: !!todo.completed,
          createdAt: todo.createdAt || Date.now(),
          updatedAt: todo.updatedAt || Date.now()
        }).catch(() => {});
      }
    }

    for (const file of legacyFiles) {
      if (file?.id && file?.name) {
        await setRTDBFile(uid, {
          ...file,
          updatedAt: file.updatedAt || Date.now()
        }).catch(() => {});
      }
    }

    // Migration finished: clear legacy un-scoped keys so different accounts don't collide
    localStorage.removeItem('lob_blocks');
    localStorage.removeItem('lob_todos');
    localStorage.removeItem('lob_files_meta');
    console.log('[LifeOfBlocks Migration] Completed successfully.');
  } catch (err) {
    console.warn('[LifeOfBlocks Migration Warning]', err);
  }
}

// ----------------- REALTIME CLOUD SYNC ENGINE (RTDB) -----------------
function attachCloudListeners(uid) {
  // Clear any existing active subscriptions
  activeUnsubscribes.forEach(unsub => {
    try { if (typeof unsub === 'function') unsub(); } catch {}
  });
  activeUnsubscribes = [];

  if (!uid) return;

  updateSyncStatus('syncing', 'Connecting to Realtime Database...');

  // Error handler for RTDB listeners
  const handleRTDBError = (err) => {
    console.warn('RTDB Listener Error:', err);
    if (err?.message?.includes('permission_denied') || err?.code === 'PERMISSION_DENIED') {
      updateSyncStatus('permission_denied', 'Firebase Realtime Database rules need to be published.');
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      updateSyncStatus('offline', 'Network is offline.');
    } else {
      updateSyncStatus('error', err?.message || 'Sync error');
    }
  };

  // 1. Subscribe to Blocks in Realtime
  const unsubBlocks = subscribeRTDBBlocks(
    uid,
    (cloudBlocks) => {
      currentBlocks = (cloudBlocks || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      persistCache(uid);
      updateSyncStatus('synced', 'All blocks synchronized.');
      notifyChange();
    },
    handleRTDBError
  );

  // 2. Subscribe to Todos in Realtime
  const unsubTodos = subscribeRTDBTodos(
    uid,
    (cloudTodos) => {
      currentTodos = (cloudTodos || []).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      persistCache(uid);
      updateSyncStatus('synced', 'All tasks synchronized.');
      notifyChange();
    },
    handleRTDBError
  );

  // 3. Subscribe to Files metadata in Realtime
  const unsubFiles = subscribeRTDBFiles(
    uid,
    (cloudFiles) => {
      currentFiles = (cloudFiles || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      persistCache(uid);
      updateSyncStatus('synced', 'All files synchronized.');
      notifyChange();
    },
    handleRTDBError
  );

  activeUnsubscribes.push(unsubBlocks, unsubTodos, unsubFiles);

  // 4. Run Migration of existing local data
  migrateExistingDataToCloud(uid);
}

// Initialize Auth Observer to drive RTDB sync
if (typeof window !== 'undefined') {
  // Network online / offline listeners
  window.addEventListener('online', () => {
    if (activeUid) {
      attachCloudListeners(activeUid);
    }
  });
  window.addEventListener('offline', () => {
    updateSyncStatus('offline', 'Network is offline.');
  });

  // Listen to Auth State
  subscribeAuth((user) => {
    if (user?.uid) {
      activeUid = user.uid;
      // Load user's offline cache immediately to prevent blank flicker
      loadCache(user.uid);
      notifyChange();
      // Attach live RTDB listeners
      attachCloudListeners(user.uid);
    } else {
      activeUid = null;
      activeUnsubscribes.forEach(unsub => {
        try { if (typeof unsub === 'function') unsub(); } catch {}
      });
      activeUnsubscribes = [];
      // Load guest cache
      loadCache(null);
      updateSyncStatus('synced', 'Operating in guest mode.');
      notifyChange();
    }
  });
}

// ----------------- CRUD API: BLOCKS -----------------
export function getBlocks() {
  return [...currentBlocks];
}

export function createBlock(name, parentBlockId = null, sourceTodoId = null) {
  const newId = 'block_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newBlock = {
    id: newId,
    name: name.trim(),
    parentBlockId: parentBlockId || null,
    sourceTodoId: sourceTodoId || null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 1. Optimistic Local Update
  currentBlocks = [newBlock, ...currentBlocks];
  persistCache(activeUid);
  notifyChange();

  // 2. Realtime RTDB Write
  if (activeUid) {
    updateSyncStatus('syncing', 'Creating block in cloud...');
    setRTDBBlock(activeUid, newBlock)
      .then(() => updateSyncStatus('synced'))
      .catch((err) => {
        console.warn('Failed to save block to RTDB:', err);
        if (err?.message?.includes('permission_denied')) {
          updateSyncStatus('permission_denied', 'Database rules blocked write.');
        } else {
          updateSyncStatus('error', err.message);
        }
      });
  }

  return newBlock.id;
}

export function updateBlock(blockId, updates) {
  let updatedBlock = null;
  currentBlocks = currentBlocks.map(b => {
    if (b.id === blockId) {
      updatedBlock = { ...b, ...updates, updatedAt: Date.now() };
      return updatedBlock;
    }
    return b;
  });

  persistCache(activeUid);
  notifyChange();

  if (activeUid && updatedBlock) {
    setRTDBBlock(activeUid, updatedBlock)
      .then(() => updateSyncStatus('synced'))
      .catch((err) => {
        console.warn('Failed to update block in RTDB:', err);
      });
  }
}

export async function deleteBlock(blockId) {
  if (!blockId) return;

  // Collect this block and all nested descendant sub-blocks recursively
  const blocksToDelete = [blockId];
  const collectDescendants = (pid) => {
    const kids = currentBlocks.filter(b => b.parentBlockId === pid);
    for (const kid of kids) {
      if (!blocksToDelete.includes(kid.id)) {
        blocksToDelete.push(kid.id);
        collectDescendants(kid.id);
      }
    }
  };
  collectDescendants(blockId);

  // If this block was created from a task, unmark that parent task
  const targetBlock = currentBlocks.find(b => b.id === blockId);
  if (targetBlock?.sourceTodoId) {
    const srcTodo = currentTodos.find(t => t.id === targetBlock.sourceTodoId);
    if (srcTodo) {
      updateTodo(srcTodo.id, { isSubBlock: false, subBlockId: null });
    }
  }

  // 1. Optimistic Local Update
  currentBlocks = currentBlocks.filter(b => !blocksToDelete.includes(b.id));
  currentTodos = currentTodos.filter(t => !blocksToDelete.includes(t.blockId));
  currentFiles = currentFiles.filter(f => !blocksToDelete.includes(f.blockId));
  persistCache(activeUid);
  notifyChange();

  // 2. Realtime RTDB Delete for all collected blocks
  if (activeUid) {
    updateSyncStatus('syncing', 'Deleting block from cloud...');
    try {
      for (const id of blocksToDelete) {
        await removeRTDBBlock(activeUid, id).catch(() => {});
      }
      updateSyncStatus('synced');
    } catch (err) {
      console.warn('Failed to delete blocks from RTDB:', err);
      updateSyncStatus('error', err.message);
    }
  }
}

// Convert an individual task into a full nested Sub-Block
export function convertTodoToSubBlock(parentBlockId, todo) {
  if (!todo) return null;

  // If already a sub-block, verify existing subBlockId
  if (todo.isSubBlock && todo.subBlockId) {
    const existing = currentBlocks.find(b => b.id === todo.subBlockId);
    if (existing) return existing.id;
  }

  // Create new child block with task title and parent reference
  const newBlockId = createBlock(todo.title || 'Untitled Sub-Block', parentBlockId, todo.id);

  // Update todo to point to this sub-block
  updateTodo(todo.id, {
    isSubBlock: true,
    subBlockId: newBlockId
  });

  return newBlockId;
}

// ----------------- CRUD API: TODOS -----------------
export function getTodos() {
  return [...currentTodos];
}

export function getTodosByBlock(blockId) {
  return currentTodos.filter(t => t.blockId === blockId);
}

export function addTodo(blockId, title) {
  const newId = 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newTodo = {
    id: newId,
    blockId,
    title: title.trim(),
    completed: false,
    isSubBlock: false,
    subBlockId: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 1. Optimistic Local Update
  currentTodos = [...currentTodos, newTodo];
  persistCache(activeUid);
  notifyChange();

  // 2. Realtime RTDB Write
  if (activeUid) {
    updateSyncStatus('syncing', 'Saving task to cloud...');
    setRTDBTodo(activeUid, newTodo)
      .then(() => updateSyncStatus('synced'))
      .catch((err) => {
        console.warn('Failed to add todo to RTDB:', err);
        updateSyncStatus('error', err.message);
      });
  }
}

export function updateTodo(todoId, updates) {
  let updatedTodo = null;
  currentTodos = currentTodos.map(t => {
    if (t.id === todoId) {
      updatedTodo = { ...t, ...updates, updatedAt: Date.now() };
      return updatedTodo;
    }
    return t;
  });

  persistCache(activeUid);
  notifyChange();

  // If title was updated and it's a sub-block, also sync the sub-block's name
  if (updates.title && updatedTodo?.isSubBlock && updatedTodo?.subBlockId) {
    updateBlock(updatedTodo.subBlockId, { name: updates.title });
  }

  // Realtime RTDB Update
  if (activeUid && updatedTodo) {
    updateSyncStatus('syncing', 'Updating task...');
    updateRTDBTodo(activeUid, todoId, updates)
      .then(() => updateSyncStatus('synced'))
      .catch((err) => {
        console.warn('Failed to update todo in RTDB:', err);
        updateSyncStatus('error', err.message);
      });
  }
}

export function deleteTodo(todoId) {
  const todo = currentTodos.find(t => t.id === todoId);
  // If the task was a sub-block, also clean up the nested child block
  if (todo?.isSubBlock && todo?.subBlockId) {
    deleteBlock(todo.subBlockId).catch(() => {});
  }

  currentTodos = currentTodos.filter(t => t.id !== todoId);
  persistCache(activeUid);
  notifyChange();

  if (activeUid) {
    updateSyncStatus('syncing', 'Removing task...');
    removeRTDBTodo(activeUid, todoId)
      .then(() => updateSyncStatus('synced'))
      .catch((err) => {
        console.warn('Failed to delete todo from RTDB:', err);
        updateSyncStatus('error', err.message);
      });
  }
}

// ----------------- CRUD API: FILES -----------------
export function getFilesMeta() {
  return [...currentFiles];
}

export function getFilesByBlock(blockId) {
  return currentFiles.filter(f => f.blockId === blockId);
}

export async function uploadFile(blockId, file, onProgress) {
  const uid = activeUid || getCurrentUser()?.uid;
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

  // 1. Cache blob locally in IndexedDB for fast instant playback
  saveFileBlob(fileId, file).catch(() => {});

  if (uid) {
    updateSyncStatus('syncing', 'Uploading file to cloud...');
    try {
      const fileMeta = await uploadFileToCloud(uid, blockId, file, onProgress, fileId);
      // Optimistic addition
      currentFiles = [fileMeta, ...currentFiles.filter(f => f.id !== fileMeta.id && f.fileId !== fileMeta.id)];
      persistCache(uid);
      updateSyncStatus('synced', 'File uploaded and synced.');
      notifyChange();
      return fileMeta;
    } catch (err) {
      console.warn('Cloud upload failed:', err);
      updateSyncStatus('error', err.message || 'File upload failed');
      throw err;
    }
  }

  // Guest Fallback (offline / unauthenticated)
  updateSyncStatus('syncing', 'Processing local file...');
  const dataUrl = await readFileAsOptimizedDataURL(file);
  const fallbackMeta = {
    fileId,
    id: fileId,
    userId: 'guest',
    blockId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    storagePath: '',
    downloadURL: dataUrl,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  currentFiles = [fallbackMeta, ...currentFiles];
  persistCache(null);
  updateSyncStatus('synced');
  notifyChange();
  if (onProgress) onProgress(100);
  return fallbackMeta;
}

export async function downloadFile(file) {
  try {
    if (file.downloadURL && file.downloadURL.startsWith('http')) {
      const link = document.createElement('a');
      link.href = file.downloadURL;
      link.download = file.name || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (file.downloadURL && file.downloadURL.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = file.downloadURL;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Try IndexedDB blob
    const targetId = file.id || file.fileId;
    const blob = await getFileBlob(targetId);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return;
    }

    if (file.downloadURL) {
      window.open(file.downloadURL, '_blank');
    }
  } catch (err) {
    console.error('File download error:', err);
    if (file.downloadURL) {
      window.open(file.downloadURL, '_blank');
    }
  }
}

export async function deleteFile(fileId) {
  const target = currentFiles.find(f => f.id === fileId || f.fileId === fileId);
  currentFiles = currentFiles.filter(f => f.id !== fileId && f.fileId !== fileId);

  const uid = activeUid || getCurrentUser()?.uid;
  persistCache(uid);
  notifyChange();

  deleteFileBlob(fileId).catch(() => {});

  if (uid && target) {
    updateSyncStatus('syncing', 'Deleting file from cloud...');
    try {
      await deleteFileFromCloud(uid, target);
      updateSyncStatus('synced');
    } catch (err) {
      console.warn('Failed to delete file from cloud:', err);
      updateSyncStatus('error', err.message);
    }
  }
}

// ----------------- UI SUBSCRIPTION HOOK -----------------
export function subscribeToStorage(callback) {
  const handler = () => callback();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
