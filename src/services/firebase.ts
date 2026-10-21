import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { BlockItem } from '../types';

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
 * Sign in with Google using popup, with automatic redirect fallback for strict mobile WebViews
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked by browser/webview, attempt redirect flow
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.code === 'auth/popup-closed-by-user'
    ) {
      console.warn('Popup blocked, attempting redirect sign-in...', error);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        throw redirectError;
      }
    }
    throw error;
  }
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
 * Save / sync user blocks to Cloud Firestore
 */
export async function syncBlocksToFirestore(uid: string, blocks: BlockItem[]): Promise<void> {
  if (!uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        blocks,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync blocks to Firestore:', error);
  }
}

/**
 * Load user blocks from Cloud Firestore once
 */
export async function fetchBlocksFromFirestore(uid: string): Promise<BlockItem[] | null> {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.blocks)) {
        return data.blocks as BlockItem[];
      }
    }
  } catch (error) {
    console.error('Failed to fetch blocks from Firestore:', error);
  }
  return null;
}

/**
 * Subscribe to realtime Cloud Firestore updates for user blocks
 */
export function subscribeBlocksFromFirestore(
  uid: string,
  onUpdate: (blocks: BlockItem[]) => void
) {
  if (!uid) return () => {};
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.blocks)) {
          onUpdate(data.blocks as BlockItem[]);
        }
      }
    },
    (error) => {
      console.warn('Firestore blocks listener error:', error);
    }
  );
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
 * Fetch user preferences from Firestore
 */
export async function fetchPreferencesFromFirestore(uid: string): Promise<any | null> {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.preferences || null;
    }
  } catch (error) {
    console.error('Failed to fetch preferences from Firestore:', error);
  }
  return null;
}
