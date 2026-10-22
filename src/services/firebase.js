import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// 1. Get Firebase Config from ENV or localStorage
export function getFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  try {
    const saved = localStorage.getItem('lob_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved Firebase config', e);
  }

  return null;
}

export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('lob_firebase_config', JSON.stringify(config));
    window.location.reload();
  } catch (e) {
    console.error('Error saving config', e);
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem('lob_firebase_config');
  window.location.reload();
}

let app = null;
let db = null;
let storage = null;
let auth = null;

const activeConfig = getFirebaseConfig();
export const isFirebaseConfigured = Boolean(activeConfig && activeConfig.apiKey && activeConfig.projectId);

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, db, storage, auth };

// AUTH HELPERS
export function subscribeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth not configured');
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signInGuest() {
  if (!auth) throw new Error('Firebase Auth not configured');
  return signInAnonymously(auth);
}

export async function signOutUser() {
  if (!auth) return;
  return signOut(auth);
}

// REALTIME FIRESTORE LISTENERS

/**
 * Subscribe to all Blocks for a user.
 * users/{uid}/blocks/{blockId}
 */
export function subscribeBlocks(uid, callback) {
  if (!db || !uid) return () => {};
  const blocksRef = collection(db, 'users', uid, 'blocks');
  const q = query(blocksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const blocks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(blocks);
  }, (err) => {
    console.error('Blocks listener error:', err);
    // Fallback query without orderBy if index is building
    const fallbackSub = onSnapshot(blocksRef, (fallbackSnap) => {
      const blocks = fallbackSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return timeB - timeA;
      });
      callback(blocks);
    });
    return fallbackSub;
  });
}

/**
 * Create a new Block
 */
export async function createBlock(uid, name) {
  if (!db || !uid) throw new Error('Database not initialized');
  const blocksRef = collection(db, 'users', uid, 'blocks');
  const newBlockDoc = await addDoc(blocksRef, {
    name: name.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedTodos: 0,
    totalTodos: 0
  });
  return newBlockDoc.id;
}

/**
 * Delete a Block and all its subcollections
 */
export async function deleteBlock(uid, blockId) {
  if (!db || !uid || !blockId) return;

  // 1. Delete todos subcollection
  try {
    const todosRef = collection(db, 'users', uid, 'blocks', blockId, 'todos');
    const todosSnap = await getDocs(todosRef);
    const deleteTodosPromises = todosSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deleteTodosPromises);
  } catch (e) {
    console.warn('Error deleting sub-todos:', e);
  }

  // 2. Delete files subcollection and storage objects
  try {
    const filesRef = collection(db, 'users', uid, 'blocks', blockId, 'files');
    const filesSnap = await getDocs(filesRef);
    for (const fDoc of filesSnap.docs) {
      const fData = fDoc.data();
      if (fData.storagePath && storage) {
        try {
          const fileStorageRef = ref(storage, fData.storagePath);
          await deleteObject(fileStorageRef);
        } catch (storageErr) {
          console.warn('Storage delete warning:', storageErr);
        }
      }
      await deleteDoc(fDoc.ref);
    }
  } catch (e) {
    console.warn('Error deleting sub-files:', e);
  }

  // 3. Delete block document
  const blockRef = doc(db, 'users', uid, 'blocks', blockId);
  await deleteDoc(blockRef);
}

/**
 * Subscribe to Todos for a Block
 * users/{uid}/blocks/{blockId}/todos/{todoId}
 */
export function subscribeTodos(uid, blockId, callback) {
  if (!db || !uid || !blockId) return () => {};
  const todosRef = collection(db, 'users', uid, 'blocks', blockId, 'todos');
  const q = query(todosRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const todos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(todos);
    
    // Sync completion status on the parent block
    const completedCount = todos.filter(t => t.completed).length;
    const totalCount = todos.length;
    syncBlockCounts(uid, blockId, completedCount, totalCount);
  }, (err) => {
    console.error('Todos listener error:', err);
    // Fallback without ordering
    return onSnapshot(todosRef, (snap) => {
      const todos = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return timeA - timeB;
      });
      callback(todos);
    });
  });
}

/**
 * Sync counts on parent block
 */
async function syncBlockCounts(uid, blockId, completedCount, totalCount) {
  if (!db || !uid || !blockId) return;
  try {
    const blockRef = doc(db, 'users', uid, 'blocks', blockId);
    await updateDoc(blockRef, {
      completedTodos: completedCount,
      totalTodos: totalCount,
      updatedAt: serverTimestamp()
    });
  } catch {
    // Non-critical background sync
  }
}

/**
 * Add a Todo
 */
export async function addTodo(uid, blockId, title) {
  if (!db || !uid || !blockId) throw new Error('Database not initialized');
  const todosRef = collection(db, 'users', uid, 'blocks', blockId, 'todos');
  return addDoc(todosRef, {
    title: title.trim(),
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Update a Todo (toggle completed or edit title)
 */
export async function updateTodo(uid, blockId, todoId, updates) {
  if (!db || !uid || !blockId || !todoId) return;
  const todoRef = doc(db, 'users', uid, 'blocks', blockId, 'todos', todoId);
  return updateDoc(todoRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a Todo
 */
export async function deleteTodo(uid, blockId, todoId) {
  if (!db || !uid || !blockId || !todoId) return;
  const todoRef = doc(db, 'users', uid, 'blocks', blockId, 'todos', todoId);
  return deleteDoc(todoRef);
}

/**
 * Subscribe to Files for a Block
 * users/{uid}/blocks/{blockId}/files/{fileId}
 */
export function subscribeFiles(uid, blockId, callback) {
  if (!db || !uid || !blockId) return () => {};
  const filesRef = collection(db, 'users', uid, 'blocks', blockId, 'files');
  const q = query(filesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const files = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(files);
  }, (err) => {
    console.error('Files listener error:', err);
    return onSnapshot(filesRef, (snap) => {
      const files = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return timeB - timeA;
      });
      callback(files);
    });
  });
}

/**
 * Upload a File to Firebase Storage and save metadata in Firestore
 * users/{uid}/blocks/{blockId}/files/{fileId}_{filename}
 */
export function uploadFile(uid, blockId, file, onProgress) {
  if (!storage || !db || !uid || !blockId) {
    throw new Error('Storage or database not initialized');
  }

  return new Promise((resolve, reject) => {
    const filesRef = collection(db, 'users', uid, 'blocks', blockId, 'files');
    const newFileDoc = doc(filesRef);
    const fileId = newFileDoc.id;

    // Clean filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${uid}/blocks/${blockId}/files/${fileId}_${safeName}`;
    const fileStorageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(fileStorageRef, file, {
      contentType: file.type || 'application/octet-stream',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await setDoc(newFileDoc, {
            name: file.name,
            storagePath: storagePath,
            downloadURL: downloadURL,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            createdAt: serverTimestamp()
          });
          resolve({ id: fileId, name: file.name, downloadURL });
        } catch (err) {
          console.error('Error writing file metadata:', err);
          reject(err);
        }
      }
    );
  });
}

/**
 * Delete a File from both Firebase Storage and Firestore
 */
export async function deleteFile(uid, blockId, file) {
  if (!db || !uid || !blockId || !file) return;

  // 1. Delete from Firebase Storage
  if (file.storagePath && storage) {
    try {
      const fileStorageRef = ref(storage, file.storagePath);
      await deleteObject(fileStorageRef);
    } catch (err) {
      console.warn('Storage deletion warning (might already be deleted):', err);
    }
  }

  // 2. Delete metadata from Firestore
  const fileDocRef = doc(db, 'users', uid, 'blocks', blockId, 'files', file.id);
  await deleteDoc(fileDocRef);
}
