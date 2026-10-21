import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithCredential,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { BlockItem, BlockFile } from '../types';

// Web App Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: 'AIzaSyCDD1dWKCybEZH9pQJuFpqxILgopEFFMpM',
  authDomain: 'life-of-blocks.firebaseapp.com',
  projectId: 'life-of-blocks',
  storageBucket: 'life-of-blocks.firebasestorage.app',
  messagingSenderId: '853169901922',
  appId: '1:853169901922:web:85d774bbfc8e7331329c3b',
  measurementId: 'G-GSHY47NMZB',
};

// Initialize Firebase App singleton safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Google Auth Provider configured with prompt selection
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in with Google:
 * - On Native Android / iOS: Uses native Google Play Services via @codetrix-studio/capacitor-google-auth
 *   without any WebView popups or redirects, returning idToken directly to Firebase Auth.
 * - On Web / Desktop Browser: Uses Firebase Auth standard popup with redirect fallback.
 */
export async function signInWithGoogle(): Promise<User> {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      try {
        GoogleAuth.initialize({
          clientId: '853169901922-7snl0o0p9amuaepog2qi5tqt4qhi0mf8.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
      } catch {}

      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed to retrieve authentication token.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } catch (nativeErr: any) {
      console.warn('Native Google Auth error:', nativeErr);
      const msg = (nativeErr?.message || '').toLowerCase();
      if (
        msg.includes('cancel') ||
        nativeErr.code === '12501' ||
        nativeErr.code === 12501 ||
        msg.includes('12501')
      ) {
        throw new Error('Sign-in cancelled.');
      }
      if (
        nativeErr.code === '10' ||
        nativeErr.code === 10 ||
        msg.includes('developer_error') ||
        msg.includes(': 10')
      ) {
        throw new Error(
          'Google Play Services requires adding your Android SHA-1 fingerprint in Firebase Console. You can also sign in instantly using the Email tab.'
        );
      }
      throw nativeErr;
    }
  }

  // Web Browser Flow
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Google Sign-In Popup Error:', error);

    // If popup was closed intentionally by user, DO NOT force a redirect
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      throw new Error('Sign-in cancelled.');
    }

    // Only if popup was strictly blocked by browser popup policy, fallback to redirect
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return new Promise<User>(() => {});
      } catch (redirectError) {
        throw redirectError;
      }
    }

    throw error;
  }
}

/**
 * Sign in with Email & Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

/**
 * Sign up with Email & Password
 */
export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user;
}

/**
 * Check if the user returned from a redirect sign in flow
 */
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.error('Redirect sign-in error:', err);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Authentication state changes
 */
export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Convert Blob to Data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload a file to Firebase Storage under `users/{uid}/files/{fileId}_{fileName}`.
 * The cloud storage is the single source of truth for files across all devices.
 */
export async function uploadUserFile(
  uid: string,
  blockId: string,
  fileDataOrBlob: Blob | string,
  fileName: string,
  fileId: string,
  mimeType?: string
): Promise<{ cloudUrl: string; storagePath: string }> {
  if (!uid || !fileId) {
    throw new Error('User UID and File ID are required for cloud file storage.');
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${uid}/files/${fileId}_${safeName}`;

  try {
    const storageRef = ref(storage, storagePath);

    if (fileDataOrBlob instanceof Blob) {
      await uploadBytes(storageRef, fileDataOrBlob, { contentType: mimeType || fileDataOrBlob.type });
    } else if (typeof fileDataOrBlob === 'string' && fileDataOrBlob.startsWith('data:')) {
      await uploadString(storageRef, fileDataOrBlob, 'data_url');
    }

    const cloudUrl = await getDownloadURL(storageRef);
    return { cloudUrl, storagePath };
  } catch (storageError) {
    console.warn('Firebase Storage direct upload error, attempting Firestore fallback:', storageError);

    // Resilient fallback: store payload in users/{uid}/files/{fileId}
    let dataUrl = typeof fileDataOrBlob === 'string' ? fileDataOrBlob : await blobToDataUrl(fileDataOrBlob);
    if (dataUrl && dataUrl.length < 900000) {
      const fileDocRef = doc(db, 'users', uid, 'files', fileId);
      await setDoc(fileDocRef, {
        id: fileId,
        ownerUid: uid,
        blockId,
        name: fileName,
        type: mimeType || '',
        dataUrl,
        storagePath: `firestore:users/${uid}/files/${fileId}`,
        updatedAt: serverTimestamp(),
      });
      return { cloudUrl: dataUrl, storagePath: `firestore:${fileId}` };
    }
    throw storageError;
  }
}

/**
 * Delete a file from Cloud Storage
 */
export async function deleteUserFile(storagePath?: string): Promise<void> {
  if (!storagePath) return;

  if (storagePath.startsWith('firestore:')) {
    const fileId = storagePath.replace('firestore:', '').split('/').pop();
    if (fileId) {
      try {
        const uid = auth.currentUser?.uid;
        if (uid) {
          await deleteDoc(doc(db, 'users', uid, 'files', fileId));
        }
      } catch {}
    }
    return;
  }

  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef).catch(() => {});
  } catch (e) {
    console.warn('Error deleting cloud file:', e);
  }
}

/**
 * Sanitize a block before writing to Firestore.
 * Prevents huge base64 strings from bloating block documents, ensuring fast realtime sync.
 */
export function sanitizeBlockForCloud(block: BlockItem, uid: string): BlockItem {
  const sanitizedFiles: BlockFile[] = (block.files || []).map((f) => {
    const isLargeBase64 = typeof f.data === 'string' && f.data.startsWith('data:') && f.data.length > 25000;
    return {
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      cloudUrl: f.cloudUrl || (f.data.startsWith('http') ? f.data : ''),
      storagePath: f.storagePath || (f.cloudUrl ? `users/${uid}/files/${f.id}` : undefined),
      ownerUid: uid,
      createdAt: f.createdAt || Date.now(),
      // In cloud doc, avoid storing huge base64 strings
      data: isLargeBase64 ? (f.cloudUrl || '') : f.data,
    };
  });

  return {
    id: block.id,
    name: block.name,
    ownerUid: uid,
    tasks: (block.tasks || []).map((t) => ({
      id: t.id,
      text: t.text,
      done: !!t.done,
      createdAt: t.createdAt || Date.now(),
    })),
    files: sanitizedFiles,
    createdAt: block.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Save an individual block to Firestore under `users/{uid}/blocks/{blockId}`
 */
export async function saveUserBlock(uid: string, block: BlockItem): Promise<void> {
  if (!uid || !block.id) return;
  try {
    const sanitized = sanitizeBlockForCloud(block, uid);
    const blockDocRef = doc(db, 'users', uid, 'blocks', block.id);
    await setDoc(blockDocRef, sanitized, { merge: true });
  } catch (error) {
    console.error('Failed to save block to Firestore:', error);
    throw error;
  }
}

/**
 * Delete an individual block from Firestore under `users/{uid}/blocks/{blockId}`
 */
export async function deleteUserBlock(uid: string, blockId: string): Promise<void> {
  if (!uid || !blockId) return;
  try {
    const blockDocRef = doc(db, 'users', uid, 'blocks', blockId);
    await deleteDoc(blockDocRef);
  } catch (error) {
    console.error('Failed to delete block from Firestore:', error);
    throw error;
  }
}

/**
 * Batch synchronize all blocks for a user to Firestore.
 */
export async function syncUserBlocks(uid: string, blocks: BlockItem[]): Promise<void> {
  if (!uid) return;
  try {
    const promises = blocks.map((b) => saveUserBlock(uid, b));
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to sync blocks to Firestore:', error);
  }
}

/**
 * Real-time subscription to user's blocks in Cloud Firestore.
 * When ANY client (Web, Android APK, Desktop) creates, modifies, or deletes a block,
 * all other clients receive the update in real-time.
 */
export function subscribeUserBlocks(
  uid: string,
  onUpdate: (blocks: BlockItem[]) => void
) {
  if (!uid) return () => {};

  const blocksColRef = collection(db, 'users', uid, 'blocks');

  return onSnapshot(
    blocksColRef,
    (snapshot) => {
      const cloudBlocks: BlockItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as BlockItem;
        if (data && data.id && data.name) {
          cloudBlocks.push({
            id: data.id,
            name: data.name,
            ownerUid: uid,
            tasks: data.tasks || [],
            files: (data.files || []).map((f) => ({
              ...f,
              data: f.cloudUrl || f.data || '',
            })),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        }
      });

      // Sort consistently by createdAt
      cloudBlocks.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      onUpdate(cloudBlocks);
    },
    (error) => {
      console.warn('Realtime Cloud Firestore blocks subscription error:', error);
    }
  );
}

/**
 * Subscribe to user preferences in Cloud Firestore under `users/{uid}/preferences/settings`
 */
export function subscribeUserPreferences(
  uid: string,
  onUpdate: (prefs: { theme?: string; wallpaperIndex?: number; apps?: any[] }) => void
) {
  if (!uid) return () => {};

  const prefDocRef = doc(db, 'users', uid, 'preferences', 'settings');

  return onSnapshot(
    prefDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          onUpdate(data);
        }
      }
    },
    (error) => {
      console.warn('Preferences listener error:', error);
    }
  );
}

/**
 * Save user preferences to Cloud Firestore
 */
export async function saveUserPreferences(
  uid: string,
  prefs: { theme?: string; wallpaperIndex?: number; apps?: any[] }
): Promise<void> {
  if (!uid) return;
  try {
    const prefDocRef = doc(db, 'users', uid, 'preferences', 'settings');
    await setDoc(prefDocRef, { ...prefs, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error('Failed to save preferences to Firestore:', error);
  }
}

/**
 * Load file payload if not already in memory (handles Cloud Storage URLs and Firestore fallback)
 */
export async function loadFilePayload(uid: string, file: BlockFile): Promise<string> {
  if (file.data && file.data.startsWith('data:')) {
    return file.data;
  }
  if (file.cloudUrl && file.cloudUrl.startsWith('http')) {
    return file.cloudUrl;
  }
  if (file.storagePath) {
    if (file.storagePath.startsWith('firestore:')) {
      const fileId = file.storagePath.replace('firestore:', '').replace(`users/${uid}/files/`, '');
      try {
        const fileSnap = await getDoc(doc(db, 'users', uid, 'files', fileId));
        if (fileSnap.exists()) {
          const d = fileSnap.data();
          return d.dataUrl || d.cloudUrl || '';
        }
      } catch (e) {
        console.warn('Error fetching file payload from Firestore:', e);
      }
    } else {
      try {
        const storageRef = ref(storage, file.storagePath);
        return await getDownloadURL(storageRef);
      } catch (e) {
        console.warn('Error fetching download URL from Storage:', e);
      }
    }
  }
  return file.cloudUrl || file.data || '';
}

/**
 * Compatible wrapper for uploading a block file
 */
export async function uploadBlockFile(
  uid: string,
  blockId: string,
  fileId: string,
  fileName: string,
  fileDataOrBlob: Blob | string,
  mimeType?: string
): Promise<{ cloudUrl: string; storagePath: string; cloudDocId?: string }> {
  const res = await uploadUserFile(uid, blockId, fileDataOrBlob, fileName, fileId, mimeType);
  return {
    cloudUrl: res.cloudUrl,
    storagePath: res.storagePath,
    cloudDocId: fileId,
  };
}

/**
 * Compatible wrapper for deleting a block file from cloud
 */
export async function deleteBlockFileFromCloud(
  uid: string,
  _blockId: string,
  fileId: string,
  fileName?: string
): Promise<void> {
  const safeName = (fileName || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = safeName ? `users/${uid}/files/${fileId}_${safeName}` : `users/${uid}/files/${fileId}`;
  await deleteUserFile(path);
  await deleteUserFile(`firestore:${fileId}`);
}

// Aliases for seamless integration with all parts of the application
export const subscribeBlocksFromFirestore = subscribeUserBlocks;
export const syncBlocksToFirestore = syncUserBlocks;
export const deleteBlockFromCloud = deleteUserBlock;
export const subscribePreferencesFromFirestore = subscribeUserPreferences;
export const syncPreferencesToFirestore = saveUserPreferences;

