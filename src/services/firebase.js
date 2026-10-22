import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update, 
  remove, 
  get 
} from 'firebase/database';
import { 
  getStorage, 
  ref as storageRef, 
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
  databaseURL: "https://life-of-blocks-default-rtdb.firebaseio.com",
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
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
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
let rtdb = null;
let storage = null;
let auth = null;

try {
  const activeConfig = getFirebaseConfig();
  app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
  rtdb = getDatabase(app, activeConfig.databaseURL || DEFAULT_FIREBASE_CONFIG.databaseURL);
  storage = getStorage(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, rtdb, storage, auth };

// ========================================================
// AUTHENTICATION HELPERS
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
    // Native Android / iOS Flow:
    // Opens the native Google Account chooser bottom-sheet!
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result.credential?.idToken;
    if (idToken) {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    }
    return result.user;
  } else {
    // Web: Standard Google popup
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
// REALTIME DATABASE (RTDB) SYNC: BLOCKS
// Path: users/{uid}/blocks
// ========================================================

export function subscribeRTDBBlocks(uid, callback) {
  if (!rtdb || !uid) return () => {};
  const blocksRef = ref(rtdb, `users/${uid}/blocks`);

  return onValue(blocksRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const blocksArray = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(key => ({ id: key, ...val[key] }));
      callback(blocksArray);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('RTDB blocks listen error:', err);
  });
}

export async function setRTDBBlock(uid, block) {
  if (!rtdb || !uid || !block?.id) return;
  const blockRef = ref(rtdb, `users/${uid}/blocks/${block.id}`);
  return set(blockRef, block);
}

export async function removeRTDBBlock(uid, blockId) {
  if (!rtdb || !uid || !blockId) return;
  const blockRef = ref(rtdb, `users/${uid}/blocks/${blockId}`);
  await remove(blockRef).catch(() => {});

  // Remove corresponding todos
  try {
    const todosRef = ref(rtdb, `users/${uid}/todos`);
    const snap = await get(todosRef);
    if (snap.exists()) {
      const val = snap.val() || {};
      for (const [key, t] of Object.entries(val)) {
        if (t && t.blockId === blockId) {
          await remove(ref(rtdb, `users/${uid}/todos/${key}`)).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn('Error deleting sub todos in RTDB:', e);
  }
}

// ========================================================
// REALTIME DATABASE (RTDB) SYNC: TODOS
// Path: users/{uid}/todos
// ========================================================

export function subscribeRTDBTodos(uid, callback) {
  if (!rtdb || !uid) return () => {};
  const todosRef = ref(rtdb, `users/${uid}/todos`);

  return onValue(todosRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const todosArray = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(key => ({ id: key, ...val[key] }));
      callback(todosArray);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('RTDB todos listen error:', err);
  });
}

export async function setRTDBTodo(uid, todo) {
  if (!rtdb || !uid || !todo?.id) return;
  const todoRef = ref(rtdb, `users/${uid}/todos/${todo.id}`);
  return set(todoRef, todo);
}

export async function removeRTDBTodo(uid, todoId) {
  if (!rtdb || !uid || !todoId) return;
  const todoRef = ref(rtdb, `users/${uid}/todos/${todoId}`);
  return remove(todoRef);
}

// ========================================================
// REALTIME DATABASE (RTDB) SYNC: FILES
// Path: users/{uid}/files
// ========================================================

export function subscribeRTDBFiles(uid, callback) {
  if (!rtdb || !uid) return () => {};
  const filesRef = ref(rtdb, `users/${uid}/files`);

  return onValue(filesRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const filesArray = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(key => ({ id: key, ...val[key] }));
      callback(filesArray);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('RTDB files listen error:', err);
  });
}

export async function setRTDBFile(uid, fileMeta) {
  if (!rtdb || !uid || !fileMeta?.id) return;
  const fileRef = ref(rtdb, `users/${uid}/files/${fileMeta.id}`);
  return set(fileRef, fileMeta);
}

export async function removeRTDBFile(uid, fileId) {
  if (!rtdb || !uid || !fileId) return;
  const fileRef = ref(rtdb, `users/${uid}/files/${fileId}`);
  return remove(fileRef);
}

// ========================================================
// CLOUD STORAGE (Cloudinary CDN + Firebase Storage)
// ========================================================

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

  // 2. Fallback to Firebase Cloud Storage CDN
  if (!downloadURL && storage) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    storagePath = `users/${uid}/blocks/${blockId}/files/${fileId}_${safeName}`;
    const fileStorageRef = storageRef(storage, storagePath);

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

  // 3. Save file metadata in RTDB
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

  if (rtdb && uid) {
    await setRTDBFile(uid, fileMeta);
  }

  return fileMeta;
}

export async function deleteFileFromCloud(uid, file) {
  if (!uid || !file) return;

  // 1. Delete from Firebase Storage if applicable
  if (file.storagePath && file.cdnProvider === 'firebase' && storage) {
    try {
      const fileStorageRef = storageRef(storage, file.storagePath);
      await deleteObject(fileStorageRef);
    } catch (e) {
      console.warn('Storage deletion warning:', e);
    }
  }

  // 2. Delete metadata from RTDB
  if (rtdb) {
    await removeRTDBFile(uid, file.id);
  }
}
