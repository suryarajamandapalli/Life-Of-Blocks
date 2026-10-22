// Simple, robust client-side storage for LIFE OF BLOCKS
// Uses localStorage for Blocks and Todos, and IndexedDB for Files (handling large uploads without limits)

const BLOCKS_KEY = 'lob_blocks';
const TODOS_KEY = 'lob_todos';
const FILES_META_KEY = 'lob_files_meta';

// Helper for local event broadcasting across tabs/windows and cross-device sync
const STORAGE_EVENT = 'lob_storage_update';
function notifyChange(action = 'CHANGE', data = null) {
  window.dispatchEvent(new Event(STORAGE_EVENT));
  try {
    if (typeof window !== 'undefined' && window.__lob_broadcast_change) {
      window.__lob_broadcast_change(action, data);
    }
  } catch (e) {
    console.debug('Sync broadcast deferred', e);
  }
}

// ----------------- IndexedDB for Files -----------------
const DB_NAME = 'LOB_Files_DB';
const DB_VERSION = 1;
const STORE_NAME = 'files_blobs';

function openDB() {
  return new Promise((resolve, reject) => {
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

async function saveFileBlob(id, file) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ id, blob: file });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getFileBlob(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

export async function getFileObjectUrl(id) {
  const blob = await getFileBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function getFileContent(id, format = 'text') {
  const blob = await getFileBlob(id);
  if (!blob) return null;
  if (format === 'arrayBuffer') {
    return await blob.arrayBuffer();
  }
  return await blob.text();
}

async function deleteFileBlob(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ----------------- BLOCKS -----------------
export function getBlocks() {
  try {
    const data = localStorage.getItem(BLOCKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function createBlock(name) {
  const blocks = getBlocks();
  const newBlock = {
    id: 'block_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  blocks.unshift(newBlock);
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  notifyChange();
  return newBlock.id;
}

export async function deleteBlock(blockId) {
  // 1. Remove block
  const blocks = getBlocks().filter(b => b.id !== blockId);
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));

  // 2. Remove todos for this block
  const todos = getTodos().filter(t => t.blockId !== blockId);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));

  // 3. Remove files for this block
  const allFiles = getFilesMeta();
  const remainingFiles = [];
  for (const f of allFiles) {
    if (f.blockId === blockId) {
      try {
        await deleteFileBlob(f.id);
      } catch (e) {
        console.warn('Failed to delete file blob:', e);
      }
    } else {
      remainingFiles.push(f);
    }
  }
  localStorage.setItem(FILES_META_KEY, JSON.stringify(remainingFiles));

  notifyChange();
}

// ----------------- TODOS -----------------
export function getTodos() {
  try {
    const data = localStorage.getItem(TODOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getTodosByBlock(blockId) {
  return getTodos().filter(t => t.blockId === blockId);
}

export function addTodo(blockId, title) {
  const todos = getTodos();
  const newTodo = {
    id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    blockId,
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  todos.push(newTodo);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();
  return newTodo;
}

export function updateTodo(todoId, updates) {
  const todos = getTodos().map(t => {
    if (t.id === todoId) {
      return { ...t, ...updates, updatedAt: Date.now() };
    }
    return t;
  });
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();
}

export function deleteTodo(todoId) {
  const todos = getTodos().filter(t => t.id !== todoId);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();
}

// ----------------- FILES -----------------
export function getFilesMeta() {
  try {
    const data = localStorage.getItem(FILES_META_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getFilesByBlock(blockId) {
  return getFilesMeta().filter(f => f.blockId === blockId);
}

export async function uploadFile(blockId, file, onProgress) {
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Simulated smooth progress for tactile feel
  if (onProgress) {
    onProgress(20);
    await new Promise(r => setTimeout(r, 80));
    onProgress(60);
    await new Promise(r => setTimeout(r, 80));
    onProgress(100);
    await new Promise(r => setTimeout(r, 60));
  }

  // Save blob in IndexedDB
  await saveFileBlob(fileId, file);

  // Save metadata in localStorage
  const filesMeta = getFilesMeta();
  const newFileMeta = {
    id: fileId,
    blockId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    createdAt: Date.now()
  };
  filesMeta.unshift(newFileMeta);
  localStorage.setItem(FILES_META_KEY, JSON.stringify(filesMeta));

  notifyChange();
  return newFileMeta;
}

export async function downloadFile(file) {
  try {
    const blob = await getFileBlob(file.id);
    if (!blob) throw new Error('File not found in local database');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Download error:', err);
    alert('Could not download file: ' + err.message);
  }
}

export async function deleteFile(fileId) {
  try {
    await deleteFileBlob(fileId);
  } catch (err) {
    console.warn('Failed to delete blob from IndexedDB:', err);
  }

  const filesMeta = getFilesMeta().filter(f => f.id !== fileId);
  localStorage.setItem(FILES_META_KEY, JSON.stringify(filesMeta));
  notifyChange();
}

// ----------------- Realtime Listener Hook -----------------
export function subscribeToStorage(callback) {
  const handler = () => callback();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener('storage', handler); // Cross-tab sync!

  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
