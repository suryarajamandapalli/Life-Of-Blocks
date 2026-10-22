// Wallpaper Lock, Starred Favorites & Multi-Device Sync Engine
// Connects LocalStorage and Firebase Realtime Database (RTDB)

import { rtdb, getCurrentUser, subscribeAuth } from './firebase';
import { ref, onValue, set, remove, get } from 'firebase/database';

const LOCKED_KEY = 'lob_wallpaper_locked';
const LOCKED_DATA_KEY = 'lob_locked_wallpaper';
const STARRED_KEY = 'lob_starred_wallpapers';
const WALLPAPER_EVENT = 'lob_wallpaper_update';

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(WALLPAPER_EVENT));
  }
}

// ----------------- LOCK / UNLOCK -----------------

export function isWallpaperLocked() {
  try {
    return localStorage.getItem(LOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getLockedWallpaper() {
  try {
    const raw = localStorage.getItem(LOCKED_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setWallpaperLock(locked, wallpaper = null) {
  try {
    localStorage.setItem(LOCKED_KEY, String(locked));
    if (locked && wallpaper) {
      localStorage.setItem(LOCKED_DATA_KEY, JSON.stringify(wallpaper));
    } else if (!locked) {
      localStorage.removeItem(LOCKED_DATA_KEY);
    }
    notify();

    // Sync to Realtime Database
    const user = getCurrentUser();
    if (user?.uid && rtdb) {
      const lockRef = ref(rtdb, `users/${user.uid}/settings/wallpaperLock`);
      if (locked && wallpaper) {
        await set(lockRef, { isLocked: true, wallpaper, updatedAt: Date.now() });
      } else {
        await set(lockRef, { isLocked: false, updatedAt: Date.now() });
      }
    }
  } catch (e) {
    console.warn('Failed to update wallpaper lock state:', e);
  }
}

// ----------------- STARRED FAVORITES -----------------

export function getStarredWallpapers() {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isWallpaperStarred(wallpaperId) {
  if (!wallpaperId) return false;
  const list = getStarredWallpapers();
  return list.some(item => item.id === wallpaperId);
}

export async function toggleStarWallpaper(wallpaper) {
  if (!wallpaper || !wallpaper.id) return false;
  const list = getStarredWallpapers();
  const exists = list.some(item => item.id === wallpaper.id);

  let updatedList;
  let isNowStarred;

  if (exists) {
    updatedList = list.filter(item => item.id !== wallpaper.id);
    isNowStarred = false;
  } else {
    updatedList = [
      {
        id: wallpaper.id,
        name: wallpaper.name || `Wallhaven #${wallpaper.id}`,
        url: wallpaper.url,
        starredAt: Date.now()
      },
      ...list
    ];
    isNowStarred = true;
  }

  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(updatedList));
    notify();

    // Sync to Realtime Database
    const user = getCurrentUser();
    if (user?.uid && rtdb) {
      const starRef = ref(rtdb, `users/${user.uid}/starredWallpapers/${wallpaper.id}`);
      if (isNowStarred) {
        await set(starRef, {
          id: wallpaper.id,
          name: wallpaper.name || `Wallhaven #${wallpaper.id}`,
          url: wallpaper.url,
          starredAt: Date.now()
        });
      } else {
        await remove(starRef);
      }
    }
  } catch (e) {
    console.warn('Failed to save starred wallpaper:', e);
  }

  return isNowStarred;
}

export async function removeStarredWallpaper(wallpaperId) {
  if (!wallpaperId) return;
  const list = getStarredWallpapers();
  const updatedList = list.filter(item => item.id !== wallpaperId);

  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(updatedList));
    notify();

    const user = getCurrentUser();
    if (user?.uid && rtdb) {
      const starRef = ref(rtdb, `users/${user.uid}/starredWallpapers/${wallpaperId}`);
      await remove(starRef);
    }
  } catch (e) {
    console.warn('Failed to remove starred wallpaper:', e);
  }
}

// ----------------- REALTIME DATABASE SYNC -----------------

let activeUnsubs = [];

function setupWallpaperRTDBSync(uid) {
  activeUnsubs.forEach(u => u());
  activeUnsubs = [];

  if (!uid || !rtdb) return;

  // 1. Listen for Wallpaper Lock updates from other devices
  const lockRef = ref(rtdb, `users/${uid}/settings/wallpaperLock`);
  const unsubLock = onValue(lockRef, (snap) => {
    const val = snap.val();
    if (val && typeof val.isLocked === 'boolean') {
      localStorage.setItem(LOCKED_KEY, String(val.isLocked));
      if (val.isLocked && val.wallpaper) {
        localStorage.setItem(LOCKED_DATA_KEY, JSON.stringify(val.wallpaper));
      } else {
        localStorage.removeItem(LOCKED_DATA_KEY);
      }
      notify();
    }
  });
  activeUnsubs.push(unsubLock);

  // 2. Listen for Starred Wallpapers updates from other devices
  const starredRef = ref(rtdb, `users/${uid}/starredWallpapers`);
  const unsubStarred = onValue(starredRef, (snap) => {
    const val = snap.val();
    if (val) {
      const cloudList = Array.isArray(val)
        ? val.filter(Boolean)
        : Object.keys(val).map(k => ({ id: k, ...val[k] }));

      // Merge with local list non-destructively
      const localList = getStarredWallpapers();
      const map = new Map();
      localList.forEach(item => map.set(item.id, item));
      cloudList.forEach(item => map.set(item.id, { ...(map.get(item.id) || {}), ...item }));

      const merged = Array.from(map.values()).sort((a, b) => (b.starredAt || 0) - (a.starredAt || 0));
      localStorage.setItem(STARRED_KEY, JSON.stringify(merged));
      notify();
    } else {
      // If cloud is empty but local has items, push local items to RTDB
      const localList = getStarredWallpapers();
      if (localList.length > 0) {
        localList.forEach(item => {
          set(ref(rtdb, `users/${uid}/starredWallpapers/${item.id}`), item).catch(() => {});
        });
      }
    }
  });
  activeUnsubs.push(unsubStarred);
}

if (typeof window !== 'undefined') {
  subscribeAuth((user) => {
    if (user?.uid) {
      setupWallpaperRTDBSync(user.uid);
    } else {
      activeUnsubs.forEach(u => u());
      activeUnsubs = [];
    }
  });
}

// ----------------- SUBSCRIPTION HOOK -----------------

export function subscribeWallpaperStore(callback) {
  const handler = () => callback();
  window.addEventListener(WALLPAPER_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(WALLPAPER_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
