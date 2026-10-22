// Storage & Realtime Database Sync Engine for LIFE OF BLOCKS
// Blends LocalStorage, IndexedDB & Firebase Realtime Database (RTDB)
// Safe 2-way sync: NEVER deletes local data on refresh; syncs across all devices

import { 
  getCurrentUser, 
  subscribeAuth, 
  subscribeFirestoreBlocks,
  setFirestoreBlock,
  removeFirestoreBlock,
  subscribeFirestoreTodos,
  setFirestoreTodo,
  removeFirestoreTodo,
  subscribeFirestoreFiles,
  setFirestoreFile,
  removeFirestoreFile,
  subscribeRTDBBlocks, 
  setRTDBBlock, 
  removeRTDBBlock, 
  subscribeRTDBTodos, 
  setRTDBTodo, 
  removeRTDBTodo, 
  subscribeRTDBFiles, 
  setRTDBFile, 
  removeRTDBFile, 
  uploadFileToCloud, 
  deleteFileFromCloud 
} from './firebase';

const BLOCKS_KEY = 'lob_blocks';
const TODOS_KEY = 'lob_todos';
const FILES_META_KEY = 'lob_files_meta';
const STORAGE_EVENT = 'lob_storage_update';

function notifyChange() {
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
  const meta = getFilesMeta().find(f => f.id === id);
  if (meta && meta.downloadURL) {
    return meta.downloadURL;
  }

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

  // Realtime Cloud Sync (Firestore & Realtime Database)
  if (user?.uid) {
    setFirestoreBlock(user.uid, newBlock).catch(() => {});
    setRTDBBlock(user.uid, newBlock).catch(() => {});
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

  // 4. Sync delete to Cloud (Firestore & Realtime Database)
  if (user?.uid) {
    removeFirestoreBlock(user.uid, blockId).catch(() => {});
    removeRTDBBlock(user.uid, blockId).catch(() => {});
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

  // Realtime Cloud Sync (Firestore & Realtime Database)
  if (user?.uid) {
    setFirestoreTodo(user.uid, newTodo).catch(() => {});
    setRTDBTodo(user.uid, newTodo).catch(() => {});
  }
}

export function updateTodo(todoId, updates) {
  const user = getCurrentUser();
  let updatedTodo = null;
  const todos = getTodos().map(t => {
    if (t.id === todoId) {
      updatedTodo = { ...t, ...updates, updatedAt: Date.now() };
      return updatedTodo;
    }
    return t;
  });
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();

  // Realtime Cloud Sync (Firestore & Realtime Database)
  if (user?.uid && updatedTodo) {
    setFirestoreTodo(user.uid, updatedTodo).catch(() => {});
    setRTDBTodo(user.uid, updatedTodo).catch(() => {});
  }
}

export function deleteTodo(todoId) {
  const user = getCurrentUser();
  const todos = getTodos().filter(t => t.id !== todoId);
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  notifyChange();

  // Realtime Cloud Sync (Firestore & Realtime Database)
  if (user?.uid) {
    removeFirestoreTodo(user.uid, todoId).catch(() => {});
    removeRTDBTodo(user.uid, todoId).catch(() => {});
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

  if (onProgress) onProgress(15);

  // 1. Always store full file in local IndexedDB blob storage immediately
  try {
    await saveFileBlob(fileId, file);
  } catch (err) {
    console.warn('Local blob save error:', err);
  }

  if (onProgress) onProgress(35);

  let cloudResult = null;
  if (user?.uid) {
    try {
      cloudResult = await uploadFileToCloud(user.uid, blockId, file, (pct) => {
        if (onProgress) onProgress(Math.max(35, Math.min(95, pct)));
      });
    } catch (e) {
      console.warn('Cloud upload failed, storing locally:', e);
    }
  } else {
    // Guest mode: generate Data URL if <= 3MB
    if (file.size <= 3 * 1024 * 1024) {
      try {
        const dataUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = () => res(null);
          r.readAsDataURL(file);
        });
        if (dataUrl) {
          cloudResult = { downloadURL: dataUrl, cdnProvider: 'local_data' };
        }
      } catch {}
    }
  }

  if (onProgress) onProgress(100);

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

  // Realtime Cloud Sync (Firestore & Realtime Database)
  if (user?.uid) {
    setFirestoreFile(user.uid, newFileMeta).catch(() => {});
    setRTDBFile(user.uid, newFileMeta).catch(() => {});
  }

  return newFileMeta;
}

export async function downloadFile(file) {
  try {
    if (file.downloadURL && file.downloadURL.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = file.downloadURL;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

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

  deleteFileBlob(fileId).catch(() => {});

  const remainingFiles = allFiles.filter(f => f.id !== fileId);
  localStorage.setItem(FILES_META_KEY, JSON.stringify(remainingFiles));
  notifyChange();

  if (user?.uid) {
    removeFirestoreFile(user.uid, fileId).catch(() => {});
    removeRTDBFile(user.uid, fileId).catch(() => {});
    if (targetFile) {
      deleteFileFromCloud(user.uid, targetFile).catch(e => console.warn('Cloud file delete error:', e));
    }
  }
}

// ----------------- DUAL CLOUD SYNC ENGINE (FIRESTORE & RTDB) -----------------
let activeUnsubscribes = [];

function setupCloudSync(uid) {
  // Clear any existing active subscriptions
  activeUnsubscribes.forEach(unsub => {
    try { if (typeof unsub === 'function') unsub(); } catch {}
  });
  activeUnsubscribes = [];

  if (!uid) return;

  // Handler for merging cloud blocks
  const handleIncomingBlocks = (cloudBlocks) => {
    if (!cloudBlocks || cloudBlocks.length === 0) return;
    const localBlocks = getBlocks();

    // Map existing local blocks
    const map = new Map();
    localBlocks.forEach(b => map.set(b.id, b));

    // Merge cloud blocks (cloud overwrites or adds)
    cloudBlocks.forEach(b => {
      const existing = map.get(b.id) || {};
      map.set(b.id, { ...existing, ...b });
    });

    const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(merged));
    notifyChange();
  };

  // Handler for merging cloud todos
  const handleIncomingTodos = (cloudTodos) => {
    if (!cloudTodos || cloudTodos.length === 0) return;
    const localTodos = getTodos();
    const map = new Map();
    localTodos.forEach(t => map.set(t.id, t));

    cloudTodos.forEach(t => {
      const existing = map.get(t.id) || {};
      map.set(t.id, { ...existing, ...t });
    });

    const merged = Array.from(map.values()).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    localStorage.setItem(TODOS_KEY, JSON.stringify(merged));
    notifyChange();
  };

  // Handler for merging cloud files metadata
  const handleIncomingFiles = (cloudFiles) => {
    if (!cloudFiles || cloudFiles.length === 0) return;
    const localFiles = getFilesMeta();
    const map = new Map();
    localFiles.forEach(f => map.set(f.id, f));

    cloudFiles.forEach(f => {
      const existing = map.get(f.id) || {};
      map.set(f.id, { ...existing, ...f });
    });

    const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    localStorage.setItem(FILES_META_KEY, JSON.stringify(merged));
    notifyChange();
  };

  // 1. Subscribe to Firestore in Realtime
  try {
    const unsubFsBlocks = subscribeFirestoreBlocks(uid, handleIncomingBlocks);
    const unsubFsTodos = subscribeFirestoreTodos(uid, handleIncomingTodos);
    const unsubFsFiles = subscribeFirestoreFiles(uid, handleIncomingFiles);
    activeUnsubscribes.push(unsubFsBlocks, unsubFsTodos, unsubFsFiles);
  } catch (fsErr) {
    console.warn('Firestore live sync listener error:', fsErr);
  }

  // 2. Subscribe to Realtime Database in Realtime
  try {
    const unsubRtdbBlocks = subscribeRTDBBlocks(uid, handleIncomingBlocks);
    const unsubRtdbTodos = subscribeRTDBTodos(uid, handleIncomingTodos);
    const unsubRtdbFiles = subscribeRTDBFiles(uid, handleIncomingFiles);
    activeUnsubscribes.push(unsubRtdbBlocks, unsubRtdbTodos, unsubRtdbFiles);
  } catch (rtdbErr) {
    console.warn('RTDB live sync listener error:', rtdbErr);
  }

  // 3. Initial Push: Immediately push any existing local blocks, todos, and files to cloud
  // This ensures that blocks created on PC (like 'Gate') are instantly uploaded to Firestore & RTDB
  // so your mobile phone or other devices can download them immediately!
  setTimeout(() => {
    try {
      const localBlocks = getBlocks();
      if (localBlocks && localBlocks.length > 0) {
        localBlocks.forEach(b => {
          setFirestoreBlock(uid, b).catch(() => {});
          setRTDBBlock(uid, b).catch(() => {});
        });
      }

      const localTodos = getTodos();
      if (localTodos && localTodos.length > 0) {
        localTodos.forEach(t => {
          setFirestoreTodo(uid, t).catch(() => {});
          setRTDBTodo(uid, t).catch(() => {});
        });
      }

      const localFiles = getFilesMeta();
      if (localFiles && localFiles.length > 0) {
        localFiles.forEach(f => {
          setFirestoreFile(uid, f).catch(() => {});
          setRTDBFile(uid, f).catch(() => {});
        });
      }
    } catch (e) {
      console.warn('Initial cloud push warning:', e);
    }
  }, 350);
}

// Global Auth State Observer to start live sync across all devices
if (typeof window !== 'undefined') {
  subscribeAuth((user) => {
    if (user?.uid) {
      setupCloudSync(user.uid);
    } else {
      activeUnsubscribes.forEach(unsub => {
        try { if (typeof unsub === 'function') unsub(); } catch {}
      });
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
