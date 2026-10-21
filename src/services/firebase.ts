import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
} from 'firebase/auth';
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

// Dynamically determine authDomain:
// When hosted on Vercel, use current host (e.g. life-of-blocks.vercel.app)
// which proxies /__/auth/* to Firebase, completely eliminating the cross-origin
// storage partitioning "missing initial state" error!
export const getAuthDomain = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.host;
    if (host.includes('vercel.app')) {
      return host;
    }
  }
  return 'life-of-blocks.firebaseapp.com';
};

// Web App Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: 'AIzaSyCDD1dWKCybEZH9pQJuFpqxILgopEFFMpM',
  authDomain: getAuthDomain(),
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
 * Sign in with Google using popup, with clean cancellation handling and redirect fallback
 */
export async function signInWithGoogle(): Promise<User> {
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
 * Helper to convert Blob to DataURL string
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
 * Upload an attachment to Firebase Storage (primary) with Firestore fallback.
 * Returns the public or storage download URL and optional cloud document ID.
 */
export async function uploadBlockFile(
  uid: string,
  blockId: string,
  fileId: string,
  fileName: string,
  fileDataOrBlob: Blob | string,
  mimeType?: string
): Promise<{ cloudUrl?: string; cloudDocId?: string }> {
  if (!uid || !fileId) return {};

  // 1. Try Firebase Cloud Storage first
  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `users/${uid}/blocks/${blockId}/${fileId}_${safeName}`);

    if (fileDataOrBlob instanceof Blob) {
      await uploadBytes(storageRef, fileDataOrBlob, { contentType: mimeType || fileDataOrBlob.type });
    } else if (typeof fileDataOrBlob === 'string' && fileDataOrBlob.startsWith('data:')) {
      await uploadString(storageRef, fileDataOrBlob, 'data_url');
    }

    const downloadUrl = await getDownloadURL(storageRef);
    return { cloudUrl: downloadUrl };
  } catch (storageError) {
    console.warn('Firebase Storage upload failed or not enabled, using Cloud Firestore fallback:', storageError);
  }

  // 2. Resilient Fallback: Store payload in Firestore files subcollection (up to 950KB)
  try {
    let dataUrl = '';
    if (typeof fileDataOrBlob === 'string') {
      dataUrl = fileDataOrBlob;
    } else if (fileDataOrBlob instanceof Blob) {
      dataUrl = await blobToDataUrl(fileDataOrBlob);
    }

    // Only store in Firestore if under Firestore doc limit (~950KB)
    if (dataUrl && dataUrl.length < 950000) {
      const fileDocRef = doc(db, 'users', uid, 'files', fileId);
      await setDoc(fileDocRef, {
        fileId,
        blockId,
        name: fileName,
        type: mimeType || '',
        dataUrl,
        updatedAt: serverTimestamp(),
      });
      return { cloudDocId: fileId };
    }
  } catch (firestoreDocError) {
    console.error('Failed to store file in Firestore fallback:', firestoreDocError);
  }

  return {};
}

/**
 * Retrieve file payload on another device when needed
 */
export async function loadFilePayload(uid: string, file: BlockFile): Promise<string> {
  if (file.cloudUrl) return file.cloudUrl;
  if (file.data && (file.data.startsWith('data:') || file.data.startsWith('http') || file.data.startsWith('blob:'))) {
    return file.data;
  }
  if (file.cloudDocId) {
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'files', file.cloudDocId));
      if (snap.exists() && snap.data()?.dataUrl) {
        return snap.data()?.dataUrl;
      }
    } catch (e) {
      console.warn('Error loading file payload from cloud:', e);
    }
  }
  return file.data || '';
}

/**
 * Remove attachment from cloud
 */
export async function deleteBlockFileFromCloud(
  uid: string,
  blockId: string,
  fileId: string,
  fileName: string
): Promise<void> {
  if (!uid || !fileId) return;
  try {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `users/${uid}/blocks/${blockId}/${fileId}_${safeName}`);
    await deleteObject(storageRef).catch(() => {});
  } catch {}

  try {
    await deleteDoc(doc(db, 'users', uid, 'files', fileId)).catch(() => {});
  } catch {}
}

/**
 * Sanitize a block for cloud storage to ensure it never exceeds Firestore document limits
 */
export function sanitizeBlockForCloud(block: BlockItem): BlockItem {
  const sanitizedFiles: BlockFile[] = (block.files || []).map((f) => {
    const isLargeBase64 = typeof f.data === 'string' && f.data.startsWith('data:') && f.data.length > 25000;
    return {
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      cloudUrl: f.cloudUrl || (f.data.startsWith('http') ? f.data : ''),
      cloudDocId: f.cloudDocId || (isLargeBase64 ? f.id : undefined),
      // In cloud doc, avoid storing huge base64 strings
      data: isLargeBase64 ? (f.cloudUrl || '') : f.data,
    };
  });

  return {
    id: block.id,
    name: block.name,
    tasks: block.tasks || [],
    files: sanitizedFiles,
    updatedAt: block.updatedAt || Date.now(),
  };
}

/**
 * Save user blocks to Cloud Firestore (both individual subcollections and root user document)
 */
export async function syncBlocksToFirestore(uid: string, blocks: BlockItem[]): Promise<void> {
  if (!uid) return;
  try {
    const sanitizedBlocks = blocks.map(sanitizeBlockForCloud);

    // 1. Sync to each individual subcollection document for fast granular updates
    const writePromises = sanitizedBlocks.map((block) => {
      const blockDocRef = doc(db, 'users', uid, 'blocks', block.id);
      return setDoc(blockDocRef, block, { merge: true });
    });

    // 2. Also update root user document with full array
    const userDocRef = doc(db, 'users', uid);
    writePromises.push(
      setDoc(
        userDocRef,
        {
          blocks: sanitizedBlocks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );

    await Promise.all(writePromises);
  } catch (error) {
    console.error('Failed to sync blocks to Firestore:', error);
  }
}

/**
 * Delete a block from Firestore
 */
export async function deleteBlockFromCloud(uid: string, blockId: string): Promise<void> {
  if (!uid || !blockId) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'blocks', blockId)).catch(() => {});
  } catch (e) {
    console.warn('Error deleting block doc:', e);
  }
}

/**
 * Subscribe to realtime Cloud Firestore updates for user blocks
 * Listens to the `blocks` subcollection and falls back to root document
 */
export function subscribeBlocksFromFirestore(
  uid: string,
  onUpdate: (blocks: BlockItem[]) => void
) {
  if (!uid) return () => {};

  const blocksColRef = collection(db, 'users', uid, 'blocks');
  let hasReceivedSubcollection = false;

  // Listen to subcollection
  const unsubscribeSubcol = onSnapshot(
    blocksColRef,
    (snap) => {
      if (!snap.empty) {
        hasReceivedSubcollection = true;
        const loadedBlocks: BlockItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as BlockItem;
          if (data && data.id && data.name) {
            loadedBlocks.push({
              ...data,
              tasks: data.tasks || [],
              files: (data.files || []).map((f) => ({
                ...f,
                data: f.cloudUrl || f.data || '',
              })),
            });
          }
        });
        onUpdate(loadedBlocks);
      } else if (!hasReceivedSubcollection) {
        // Subcollection is empty, check root user document
        const userDocRef = doc(db, 'users', uid);
        getDoc(userDocRef).then((userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (Array.isArray(data.blocks)) {
              onUpdate(
                data.blocks.map((b: BlockItem) => ({
                  ...b,
                  tasks: b.tasks || [],
                  files: (b.files || []).map((f) => ({
                    ...f,
                    data: f.cloudUrl || f.data || '',
                  })),
                }))
              );
            }
          }
        }).catch(() => {});
      }
    },
    (error) => {
      console.warn('Firestore blocks subcollection listener error:', error);
    }
  );

  return () => {
    unsubscribeSubcol();
  };
}

/**
 * Save user preferences (theme, wallpaper, apps list) to Firestore
 */
export async function syncPreferencesToFirestore(
  uid: string,
  prefs: { theme?: string; wallpaperIndex?: number; apps?: any[] }
): Promise<void> {
  if (!uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        preferences: prefs,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync preferences to Firestore:', error);
  }
}

/**
 * Subscribe to realtime Cloud Firestore updates for user preferences
 */
export function subscribePreferencesFromFirestore(
  uid: string,
  onUpdate: (prefs: { theme?: string; wallpaperIndex?: number; apps?: any[] }) => void
) {
  if (!uid) return () => {};
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.preferences) {
          onUpdate(data.preferences);
        }
      }
    },
    (error) => {
      console.warn('Firestore preferences listener error:', error);
    }
  );
}
