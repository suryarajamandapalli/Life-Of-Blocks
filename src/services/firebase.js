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
  getDocs,
  enableIndexedDbPersistence
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
  signInWithCredential,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { uploadToCloudinary, getCloudinaryCloudName } from './cloudinary';

// Official Production Firebase Configuration for LIFE OF BLOCKS
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCDD1dWKCybEZH9pQJuFpqxILgopEFFMpM",
  authDomain: "life-of-blocks.firebaseapp.com",
  projectId: "life-of-blocks",
  storageBucket: "life-of-blocks.firebasestorage.app",
  messagingSenderId: "853169901922",
  appId: "1:853169901922:web:85d774bbfc8e7331329c3b",
  measurementId: "G-GSHY47NMZB"
};

export function getFirebaseConfig() {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return { ...DEFAULT_FIREBASE_CONFIG, ...envConfig };
  }

  try {
    const saved = localStorage.getItem('lob_firebase_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.debug('No custom Firebase config saved; using default', e);
  }

  return DEFAULT_FIREBASE_CONFIG;
}

let app = null;
let db = null;
let storage = null;
let auth = null;

try {
  const activeConfig = getFirebaseConfig();
  app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);

  // Enable offline persistence in browser environments
  if (typeof window !== 'undefined' && db) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.debug('Multiple tabs open, Firestore persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
        console.debug('Browser does not support Firestore persistence');
      }
    });
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, db, storage, auth };

// ========================================================
// GOOGLE AUTHENTICATION HELPERS
// ========================================================

export function subscribeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  const unsubWeb = onAuthStateChanged(auth, callback);

  let unsubNative = null;
  if (Capacitor.isNativePlatform()) {
    FirebaseAuthentication.addListener('authStateChange', (change) => {
      if (change?.user) {
        callback(change.user);
      }
    }).then(listener => {
      unsubNative = listener;
    }).catch(() => {});
  }

  return () => {
    unsubWeb();
    if (unsubNative && typeof unsubNative.remove === 'function') {
      unsubNative.remove();
    }
  };
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Auth not initialized');

  if (Capacitor.isNativePlatform()) {
    // Native Android / iOS Flow via Capawesome Native SDK
    // Shows the native Android Google Account picker dialog!
    // No browser redirect, no sessionStorage issues, zero white screen!
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (idToken) {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    }
    return result.user;
  } else {
    // Web environment: Standard Firebase Google popup
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  }
}

export async function signInWithEmail(email, password) {
  if (!auth) throw new Error('Firebase Auth not initialized');
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
}

export async function signUpWithEmail(email, password) {
  if (!auth) throw new Error('Firebase Auth not initialized');
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
}

export async function signOutUser() {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut().catch(() => {});
  }
  if (auth) {
    await signOut(auth).catch(() => {});
  }
}

export function getCurrentUser() {
  return auth?.currentUser || null;
}

// ========================================================
// FIRESTORE REAL-TIME SYNC: BLOCKS
// ========================================================

/**
 * Subscribe to all Blocks for a user in Firestore
 * Collection: users/{uid}/blocks
 */
export function subscribeBlocks(uid, callback) {
  if (!db || !uid) return () => {};
  const blocksRef = collection(db, 'users', uid, 'blocks');
  const q = query(blocksRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const blocks = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(blocks);
  }, (err) => {
    console.warn('Blocks query fallback:', err);
    return onSnapshot(blocksRef, (fallbackSnap) => {
      const blocks = fallbackSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })).sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return timeB - timeA;
      });
      callback(blocks);
    });
  });
}

export async function createFirestoreBlock(uid, name, initialId) {
  if (!db || !uid) throw new Error('Database not initialized');
  const blocksRef = collection(db, 'users', uid, 'blocks');
  
  const blockData = {
    name: name.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedTodos: 0,
    totalTodos: 0
  };

  if (initialId) {
    const blockDoc = doc(blocksRef, initialId);
    await setDoc(blockDoc, blockData);
    return initialId;
  } else {
    const newDoc = await addDoc(blocksRef, blockData);
    return newDoc.id;
  }
}

export async function updateFirestoreBlock(uid, blockId, updates) {
  if (!db || !uid || !blockId) return;
  const blockRef = doc(db, 'users', uid, 'blocks', blockId);
  return updateDoc(blockRef, {
    ...updates,
    updatedAt: Date.now()
  });
}

export async function deleteFirestoreBlock(uid, blockId) {
  if (!db || !uid || !blockId) return;

  // 1. Delete all todos under this block
  try {
    const todosRef = collection(db, 'users', uid, 'todos');
    const todosSnap = await getDocs(todosRef);
    const deleteBatch = todosSnap.docs
      .filter(d => d.data().blockId === blockId)
      .map(d => deleteDoc(d.ref));
    await Promise.all(deleteBatch);
  } catch (e) {
    console.warn('Error deleting associated todos:', e);
  }

  // 2. Delete all files metadata under this block
  try {
    const filesRef = collection(db, 'users', uid, 'files');
    const filesSnap = await getDocs(filesRef);
    const deleteFilesBatch = filesSnap.docs
      .filter(d => d.data().blockId === blockId)
      .map(d => deleteDoc(d.ref));
    await Promise.all(deleteFilesBatch);
  } catch (e) {
    console.warn('Error deleting associated files:', e);
  }

  // 3. Delete block doc
  const blockRef = doc(db, 'users', uid, 'blocks', blockId);
  await deleteDoc(blockRef);
}

// ========================================================
// FIRESTORE REAL-TIME SYNC: TODOS
// ========================================================

/**
 * Subscribe to all Todos for a user across all blocks
 * Collection: users/{uid}/todos
 */
export function subscribeTodos(uid, callback) {
  if (!db || !uid) return () => {};
  const todosRef = collection(db, 'users', uid, 'todos');

  return onSnapshot(todosRef, (snapshot) => {
    const todos = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    callback(todos);
  }, (err) => {
    console.error('Todos listener error:', err);
  });
}

export async function addFirestoreTodo(uid, blockId, title, initialId) {
  if (!db || !uid || !blockId) throw new Error('Database not initialized');
  const todosRef = collection(db, 'users', uid, 'todos');
  
  const todoData = {
    blockId,
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (initialId) {
    const todoDoc = doc(todosRef, initialId);
    await setDoc(todoDoc, todoData);
    return { id: initialId, ...todoData };
  } else {
    const newDoc = await addDoc(todosRef, todoData);
    return { id: newDoc.id, ...todoData };
  }
}

export async function updateFirestoreTodo(uid, todoId, updates) {
  if (!db || !uid || !todoId) return;
  const todoRef = doc(db, 'users', uid, 'todos', todoId);
  return updateDoc(todoRef, {
    ...updates,
    updatedAt: Date.now()
  });
}

export async function deleteFirestoreTodo(uid, todoId) {
  if (!db || !uid || !todoId) return;
  const todoRef = doc(db, 'users', uid, 'todos', todoId);
  return deleteDoc(todoRef);
}

// ========================================================
// FIRESTORE REAL-TIME SYNC & STORAGE: FILES
// ========================================================

/**
 * Subscribe to all Files metadata for a user
 * Collection: users/{uid}/files
 */
export function subscribeFiles(uid, callback) {
  if (!db || !uid) return () => {};
  const filesRef = collection(db, 'users', uid, 'files');

  return onSnapshot(filesRef, (snapshot) => {
    const files = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(files);
  }, (err) => {
    console.error('Files listener error:', err);
  });
}

/**
 * Upload file to Cloudinary CDN (or Firebase Storage fallback)
 * and record metadata in Firestore
 */
export async function uploadFileToCloud(uid, blockId, file, onProgress) {
  if (!uid || !blockId || !file) {
    throw new Error('Missing upload parameters');
  }

  let downloadURL = null;
  let cdnProvider = 'firebase';
  let storagePath = null;

  // 1. Try Cloudinary CDN first if cloud name is available
  const cloudName = getCloudinaryCloudName();
  if (cloudName) {
    try {
      const cdnResult = await uploadToCloudinary(file, `lob_${uid}`, onProgress);
      downloadURL = cdnResult.url;
      cdnProvider = 'cloudinary';
      storagePath = cdnResult.publicId;
    } catch (cdnErr) {
      console.warn('Cloudinary upload deferred to Firebase Storage:', cdnErr);
    }
  }

  // 2. Fallback to Firebase Cloud Storage CDN (always available with user config)
  if (!downloadURL && storage) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    storagePath = `users/${uid}/blocks/${blockId}/files/${fileId}_${safeName}`;
    const fileStorageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(fileStorageRef, file, {
      contentType: file.type || 'application/octet-stream',
    });

    await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (onProgress) onProgress(pct);
          }
        },
        (error) => reject(error),
        async () => {
          try {
            downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  // 3. Save file metadata in Firestore
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const fileMeta = {
    id: fileId,
    blockId,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    downloadURL: downloadURL || '',
    storagePath: storagePath || '',
    cdnProvider,
    createdAt: Date.now()
  };

  if (db && uid) {
    const fileDoc = doc(db, 'users', uid, 'files', fileId);
    await setDoc(fileDoc, fileMeta);
  }

  return fileMeta;
}

/**
 * Delete a file from Cloud Storage & Firestore
 */
export async function deleteFileFromCloud(uid, file) {
  if (!uid || !file) return;

  // 1. Delete from Firebase Storage if applicable
  if (file.storagePath && file.cdnProvider === 'firebase' && storage) {
    try {
      const fileStorageRef = ref(storage, file.storagePath);
      await deleteObject(fileStorageRef);
    } catch (e) {
      console.warn('Storage deletion warning:', e);
    }
  }

  // 2. Delete metadata doc from Firestore
  if (db) {
    const fileDoc = doc(db, 'users', uid, 'files', file.id);
    await deleteDoc(fileDoc).catch((e) => console.warn('File doc delete warning:', e));
  }
}
