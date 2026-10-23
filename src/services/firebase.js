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
// AUTHENTICATION ENGINE (Web & Android APK Bridge)
// Ensures Web, Mobile Web, and Android APK share the EXACT SAME UID
// ========================================================

/**
 * Synchronizes native Android Google sign-in credentials to the Firebase Web SDK
 * so that both native and web layers have the identical authenticated currentUser and UID.
 */
export async function syncNativeAuthToWebSDK() {
  if (!Capacitor.isNativePlatform() || !auth) return null;
  try {
    const tokenResult = await FirebaseAuthentication.getIdToken().catch(() => null);
    if (tokenResult?.idToken) {
      const credential = GoogleAuthProvider.credential(tokenResult.idToken);
      const userCred = await signInWithCredential(auth, credential);
      console.log('[LifeOfBlocks Native Auth Synced to Web SDK]', {
        uid: userCred.user.uid,
        email: userCred.user.email,
        provider: userCred.user.providerData?.[0]?.providerId || 'google.com'
      });
      return userCred.user;
    }
  } catch (err) {
    console.warn('[LifeOfBlocks Native Auth Sync Notice]', err);
  }
  return null;
}

export function subscribeAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  // Web Auth Observer
  const unsubWeb = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('[LifeOfBlocks Auth Verified]', {
        uid: user.uid,
        email: user.email,
        provider: user.providerData?.[0]?.providerId || 'google.com',
        platform: Capacitor.isNativePlatform() ? 'Android APK' : 'Web Browser'
      });
    }
    callback(user);
  });

  // Android Native Auth Observer
  let unsubNative = null;
  if (Capacitor.isNativePlatform()) {
    // 1. Initial check on boot
    FirebaseAuthentication.getCurrentUser().then(res => {
      if (res?.user && (!auth.currentUser || auth.currentUser.uid !== res.user.uid)) {
        syncNativeAuthToWebSDK();
      }
    }).catch(() => {});

    // 2. State change listener
    FirebaseAuthentication.addListener('authStateChange', async (change) => {
      if (change?.user) {
        if (!auth.currentUser || auth.currentUser.uid !== change.user.uid) {
          await syncNativeAuthToWebSDK();
        }
      } else {
        if (auth.currentUser) {
          await signOut(auth).catch(() => {});
        }
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
    // Native Android Flow
    const result = await FirebaseAuthentication.signInWithGoogle();
    let idToken = result.credential?.idToken;
    if (!idToken) {
      const tokenRes = await FirebaseAuthentication.getIdToken().catch(() => null);
      idToken = tokenRes?.idToken;
    }
    if (idToken) {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      console.log('[LifeOfBlocks APK Google Sign-In Success]', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });
      return userCredential.user;
    }
    return result.user;
  } else {
    // Web Flow (Desktop + Mobile Chrome/Safari)
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    console.log('[LifeOfBlocks Web Google Sign-In Success]', {
      uid: userCredential.user.uid,
      email: userCredential.user.email
    });
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
// REALTIME DATABASE (RTDB) SYNC ENGINE: BLOCKS
// Path: users/{uid}/blocks/{blockId}
// ========================================================

export function subscribeRTDBBlocks(uid, onData, onError) {
  if (!rtdb || !uid) return () => {};
  const blocksRef = ref(rtdb, `users/${uid}/blocks`);

  return onValue(blocksRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const blocksArray = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(key => ({ id: key, ...val[key] }));
      onData(blocksArray);
    } else {
      onData([]);
    }
  }, (err) => {
    console.warn('RTDB blocks listen error:', err);
    if (onError) onError(err);
  });
}

export async function setRTDBBlock(uid, block) {
  if (!rtdb || !uid || !block?.id) return;
  const blockRef = ref(rtdb, `users/${uid}/blocks/${block.id}`);
  const clean = Object.fromEntries(Object.entries(block).filter(([_, v]) => v !== undefined));
  return set(blockRef, clean);
}

export async function removeRTDBBlock(uid, blockId) {
  if (!rtdb || !uid || !blockId) return;
  const blockRef = ref(rtdb, `users/${uid}/blocks/${blockId}`);
  await remove(blockRef);

  // Remove corresponding todos in RTDB
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
    console.warn('Sub todos cleanup warning:', e);
  }

  // Remove corresponding files in RTDB
  try {
    const filesRef = ref(rtdb, `users/${uid}/files`);
    const snap = await get(filesRef);
    if (snap.exists()) {
      const val = snap.val() || {};
      for (const [key, f] of Object.entries(val)) {
        if (f && f.blockId === blockId) {
          await remove(ref(rtdb, `users/${uid}/files/${key}`)).catch(() => {});
          if (f.storagePath && storage) {
            deleteObject(storageRef(storage, f.storagePath)).catch(() => {});
          }
        }
      }
    }
  } catch (e) {
    console.warn('Sub files cleanup warning:', e);
  }
}

// ========================================================
// REALTIME DATABASE (RTDB) SYNC ENGINE: TODOS
// Path: users/{uid}/todos/{todoId}
// ========================================================

export function subscribeRTDBTodos(uid, onData, onError) {
  if (!rtdb || !uid) return () => {};
  const todosRef = ref(rtdb, `users/${uid}/todos`);

  return onValue(todosRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const todosArray = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(key => ({ id: key, ...val[key] }));
      onData(todosArray);
    } else {
      onData([]);
    }
  }, (err) => {
    console.warn('RTDB todos listen error:', err);
    if (onError) onError(err);
  });
}

export async function setRTDBTodo(uid, todo) {
  if (!rtdb || !uid || !todo?.id) return;
  const todoRef = ref(rtdb, `users/${uid}/todos/${todo.id}`);
  const clean = Object.fromEntries(Object.entries(todo).filter(([_, v]) => v !== undefined));
  return set(todoRef, clean);
}

export async function updateRTDBTodo(uid, todoId, updates) {
  if (!rtdb || !uid || !todoId) return;
  const todoRef = ref(rtdb, `users/${uid}/todos/${todoId}`);
  const clean = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
  return update(todoRef, { ...clean, updatedAt: Date.now() });
}

export async function removeRTDBTodo(uid, todoId) {
  if (!rtdb || !uid || !todoId) return;
  const todoRef = ref(rtdb, `users/${uid}/todos/${todoId}`);
  return remove(todoRef);
}

// ========================================================
// REALTIME DATABASE (RTDB) SYNC ENGINE: FILES METADATA
// Path: users/{uid}/files/{fileId}
// ========================================================

export function subscribeRTDBFiles(uid, onData, onError) {
  if (!rtdb || !uid) return () => {};
  const filesRef = ref(rtdb, `users/${uid}/files`);

  return onValue(filesRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      const filesArray = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(key => ({ id: key, ...val[key] }));
      onData(filesArray);
    } else {
      onData([]);
    }
  }, (err) => {
    console.warn('RTDB files listen error:', err);
    if (onError) onError(err);
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
// REALTIME DATABASE (RTDB) SETTINGS SYNC
// Path: users/{uid}/settings
// ========================================================

export function subscribeRTDBSettings(uid, onData, onError) {
  if (!rtdb || !uid) return () => {};
  const settingsRef = ref(rtdb, `users/${uid}/settings`);

  return onValue(settingsRef, (snapshot) => {
    onData(snapshot.val() || {});
  }, (err) => {
    console.warn('RTDB settings listen error:', err);
    if (onError) onError(err);
  });
}

export async function setRTDBSetting(uid, key, value) {
  if (!rtdb || !uid || !key) return;
  const settingRef = ref(rtdb, `users/${uid}/settings/${key}`);
  return set(settingRef, value);
}

// ========================================================
// FIREBASE CLOUD STORAGE & REALTIME SYNC (Uploaded Files Single Source of Truth)
// Bucket: life-of-blocks.firebasestorage.app
// Path: users/{uid}/blocks/{blockId}/files/{fileId}_{safeName}
// ========================================================

/**
 * Reads a File into an optimized Data URL (Base64) to ensure instant, reliable RTDB sync
 * without hanging or network timeouts.
 */
export async function readFileAsOptimizedDataURL(file) {
  if (!file) return '';

  // If not an image or SVG/GIF, read directly as data URL
  if (!file.type || !file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  // Optimize image to keep RTDB sync blazing fast and lightweight (max 1600px dimension)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        const maxDim = 1600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result || '');
      img.src = e.target?.result || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export async function uploadFileToCloud(uid, blockId, file, onProgress, customFileId) {
  if (!uid || !blockId || !file) {
    throw new Error('Missing upload parameters: uid, blockId, file');
  }

  const fileId = customFileId || ('file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${uid}/blocks/${blockId}/files/${fileId}_${safeName}`;
  let downloadURL = null;

  if (onProgress) onProgress(20);

  // 1. Read / optimize file as base64 Data URL (fast & 100% resilient)
  const dataUrl = await readFileAsOptimizedDataURL(file);
  if (onProgress) onProgress(60);

  // 2. If Firebase Storage is available, attempt Storage with a 2-second race timeout
  if (storage) {
    try {
      const fileStorageRef = storageRef(storage, storagePath);
      const uploadTask = uploadBytesResumable(fileStorageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          userId: uid,
          blockId: blockId,
          fileId: fileId,
          originalName: file.name
        }
      });

      downloadURL = await Promise.race([
        new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (snapshot.totalBytes > 0 && onProgress) {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                onProgress(Math.min(90, Math.max(60, pct)));
              }
            },
            (error) => reject(error),
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        }),
        new Promise((_, reject) =>
          setTimeout(() => {
            try { uploadTask.cancel(); } catch {}
            reject(new Error('Storage timeout - syncing directly to RTDB'));
          }, 2000)
        )
      ]);
    } catch (storageErr) {
      console.warn('[Firebase Storage Notice - syncing directly to RTDB]:', storageErr?.message);
    }
  }

  // 3. Fallback to Data URL if Storage is 404, unauthorized, or timed out
  const finalDownloadURL = downloadURL || dataUrl;

  if (onProgress) onProgress(90);

  // 4. Metadata saved directly into RTDB
  // Stores fileId, userId, blockId, name, type, size, storagePath, downloadURL, createdAt
  const fileMeta = {
    fileId,
    id: fileId,
    userId: uid,
    blockId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    storagePath: downloadURL ? storagePath : '',
    downloadURL: finalDownloadURL,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (rtdb && uid) {
    await setRTDBFile(uid, fileMeta);
  }

  if (onProgress) onProgress(100);

  return fileMeta;
}

export async function deleteFileFromCloud(uid, file) {
  if (!uid || !file) return;

  const targetId = file.id || file.fileId;

  // 1. Delete actual binary file from Firebase Storage
  if (file.storagePath && storage) {
    try {
      const fileStorageRef = storageRef(storage, file.storagePath);
      await deleteObject(fileStorageRef);
    } catch (err) {
      console.warn('Storage delete warning:', err);
    }
  }

  // 2. Delete file metadata from RTDB
  if (rtdb && targetId) {
    await removeRTDBFile(uid, targetId);
  }
}
