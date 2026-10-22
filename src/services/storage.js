// Storage & Cloud Sync Engine for LIFE OF BLOCKS
// Blends LocalStorage, IndexedDB, Firebase Firestore & Cloud CDN
// Provides instant offline UX + real-time multi-device cloud synchronization

import { 
  getCurrentUser, 
  subscribeAuth, 
  subscribeBlocks, 
  subscribeTodos, 
  subscribeFiles,
  createFirestoreBlock,
  updateFirestoreBlock,
  deleteFirestoreBlock,
  addFirestoreTodo,
  updateFirestoreTodo,
  deleteFirestoreTodo,
  uploadFileToCloud,
  deleteFileFromCloud
} from './firebase';

const BLOCKS_KEY = 'lob_blocks';
const TODOS_KEY = 'lob_todos';
const FILES_META_KEY = 'lob_files_meta';
const STORAGE_EVENT = 'lob_storage_update';

function notifyChange(action = 'CHANGE', data = null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

// ----------------- IndexedDB for Local File Blobs -----------------
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
    console.debug('Local blob save deferred:', e);
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

export async function getFileObjectUrl(id) {
  // 1. Check if the file metadata has a cloud downloadURL
  const meta = getFilesMeta().find(f => f.id === id);
  if (meta && meta.downloadURL) {
    return meta.downloadURL;
  }

  // 2. Fallback to local IndexedDB blob
  const blob = await getFileBlob(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function getFileContent(id, format = 'text') {
  const meta = getFilesMeta().find(f => f.id === id);
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
  } catch (e) {
    console.debug('Blob delete skipped:', e);
  }
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
  const user = getCurrentUser();
  const newId = 'block_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const blocks = getBlocks();
  const newBlock = {
    id: newId,
    name: name.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  blocks.unshift(newBlock);
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
  notifyChange();

  // Sync to Firestore if authenticated
  if (user?.uid) {
    createFirestoreBlock(user.uid, name, newId).catch(e => console.warn('Cloud block sync error:', e));
  }

  return newBlock.id;
}

export async function deleteBlock(blockId) {
  const user = getCurrentUser();

  // 1. Remove block locally
  const blocks = getBlocks().filter(b => b.id !== blockId);
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));

  // 2. Remove todos for this block locally
  const todos = getTodos().filter(t => t.blockId !== blockId);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));

  // 3. Remove files for this block locally
  const allFiles = getFilesMeta();
  const remainingFiles = [];
  for (const f of allFiles) {
    if (f.blockId === blockId) {
      deleteFileBlob(f.id).catch(() => {});
    } else {
      remainingFiles.push(f);
    }
  }
  localStorage.setItem(FILES_META_KEY, JSON.stringify(remainingFiles));

  notifyChange();

  // 4. Sync delete to Firestore if authenticated
  if (user?.uid) {
    deleteFirestoreBlock(user.uid, blockId).catch(e => console.warn('Cloud block delete error:', e));
  }
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
  const user = getCurrentUser();
  const newId = 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const todos = getTodos();
  const newTodo = {
    id: newId,
    blockId,
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  todos.push(newTodo);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();

  // Sync to Firestore if authenticated
  if (user?.uid) {
    addFirestoreTodo(user.uid, blockId, title, newId).catch(e => console.warn('Cloud todo sync error:', e));
  }

  return newTodo;
}

export function updateTodo(todoId, updates) {
  const user = getCurrentUser();
  const todos = getTodos().map(t => {
    if (t.id === todoId) {
      return { ...t, ...updates, updatedAt: Date.now() };
    }
    return t;
  });
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();

  // Sync to Firestore if authenticated
  if (user?.uid) {
    updateFirestoreTodo(user.uid, todoId, updates).catch(e => console.warn('Cloud todo update error:', e));
  }
}

export function deleteTodo(todoId) {
  const user = getCurrentUser();
  const todos = getTodos().filter(t => t.id !== todoId);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();

  // Sync to Firestore if authenticated
  if (user?.uid) {
    deleteFirestoreTodo(user.uid, todoId).catch(e => console.warn('Cloud todo delete error:', e));
  }
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
  const user = getCurrentUser();
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  // Save blob locally in IndexedDB for immediate cache
  await saveFileBlob(fileId, file);

  let cloudResult = null;
  if (user?.uid) {
    try {
      cloudResult = await uploadFileToCloud(user.uid, blockId, file, onProgress);
    } catch (e) {
      console.warn('Cloud upload failed, storing locally:', e);
    }
  } else {
    // Simulated smooth progress for local mode
    if (onProgress) {
      onProgress(30);
      await new Promise(r => setTimeout(r, 60));
      onProgress(70);
      await new Promise(r => setTimeout(r, 60));
      onProgress(100);
    }
  }

  const filesMeta = getFilesMeta();
  const newFileMeta = {
    id: cloudResult?.id || fileId,
    blockId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    downloadURL: cloudResult?.downloadURL || '',
    storagePath: cloudResult?.storagePath || '',
    cdnProvider: cloudResult?.cdnProvider || 'local',
    createdAt: Date.now()
  };

  filesMeta.unshift(newFileMeta);
  localStorage.setItem(FILES_META_KEY, JSON.stringify(filesMeta));
  notifyChange();

  return newFileMeta;
}

export async function downloadFile(file) {
  try {
    // If cloud downloadURL exists, use it
    if (file.downloadURL) {
      const res = await fetch(file.downloadURL);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    // Fallback to local IndexedDB blob
    const blob = await getFileBlob(file.id);
    if (!blob) throw new Error('File blob not found');
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
    if (file.downloadURL) {
      window.open(file.downloadURL, '_blank');
    }
  }
}

export async function deleteFile(fileId) {
  const user = getCurrentUser();
  const allFiles = getFilesMeta();
  const targetFile = allFiles.find(f => f.id === fileId);

  // 1. Delete local blob
  deleteFileBlob(fileId).catch(() => {});

  // 2. Remove metadata locally
  const remainingFiles = allFiles.filter(f => f.id !== fileId);
  localStorage.setItem(FILES_META_KEY, JSON.stringify(remainingFiles));
  notifyChange();

  // 3. Delete from cloud if authenticated
  if (user?.uid && targetFile) {
    deleteFileFromCloud(user.uid, targetFile).catch(e => console.warn('Cloud file delete error:', e));
  }
}

// ----------------- Realtime Firestore Sync Engine -----------------
let activeUnsubscribes = [];

function setupFirestoreSync(uid) {
  // Clear any existing listeners
  activeUnsubscribes.forEach(unsub => unsub());
  activeUnsubscribes = [];

  if (!uid) return;

  // 1. Listen to Blocks from Firestore
  const unsubBlocks = subscribeBlocks(uid, (cloudBlocks) => {
    if (!cloudBlocks) return;
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(cloudBlocks));
    notifyChange('SYNC_BLOCKS', cloudBlocks);
  });
  activeUnsubscribes.push(unsubBlocks);

  // 2. Listen to Todos from Firestore
  const unsubTodos = subscribeTodos(uid, (cloudTodos) => {
    if (!cloudTodos) return;
    localStorage.setItem(TODOS_KEY, JSON.stringify(cloudTodos));
    notifyChange('SYNC_TODOS', cloudTodos);
  });
  activeUnsubscribes.push(unsubTodos);

  // 3. Listen to Files from Firestore
  const unsubFiles = subscribeFiles(uid, (cloudFiles) => {
    if (!cloudFiles) return;
    localStorage.setItem(FILES_META_KEY, JSON.stringify(cloudFiles));
    notifyChange('SYNC_FILES', cloudFiles);
  });
  activeUnsubscribes.push(unsubFiles);

  // 4. One-time upload of any local blocks/todos created while offline
  syncLocalToCloud(uid);
}

async function syncLocalToCloud(uid) {
  if (!uid) return;
  try {
    const localBlocks = getBlocks();
    for (const b of localBlocks) {
      await createFirestoreBlock(uid, b.name, b.id).catch(() => {});
    }

    const localTodos = getTodos();
    for (const t of localTodos) {
      await addFirestoreTodo(uid, t.blockId, t.title, t.id).catch(() => {});
    }
  } catch (e) {
    console.debug('Background local-to-cloud upload completed with notices:', e);
  }
}

// Listen for Auth changes globally to attach Firestore listeners
if (typeof window !== 'undefined') {
  subscribeAuth((user) => {
    if (user?.uid) {
      setupFirestoreSync(user.uid);
    } else {
      activeUnsubscribes.forEach(unsub => unsub());
      activeUnsubscribes = [];
    }
  });
}

// ----------------- UI Hook Subscription -----------------
export function subscribeToStorage(callback) {
  const handler = () => callback();
  window.addEventListener(STORAGE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
