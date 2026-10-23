// Pomodoro Multi-Device Realtime Sync Engine for LIFE OF BLOCKS
// Realtime Database Path: users/{uid}/pomodoro
// Synchronizes timer running state, targetEndTime (wall-clock synced), mode (focus/break),
// session count, durations, and remaining time across Laptop, Phone Browser, and Android APK!

import { rtdb, getCurrentUser, subscribeAuth } from './firebase';
import { ref, onValue, set } from 'firebase/database';

const POMODORO_STORAGE_KEY = 'lob_retro_pomodoro_state_v2';
const POMODORO_EVENT = 'lob_pomodoro_update';

let currentUid = null;
let activeUnsub = null;
let isApplyingCloudUpdate = false;

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(POMODORO_EVENT));
  }
}

export const DEFAULT_POMODORO_STATE = {
  mode: 'focus',
  sessionCount: 1,
  focusHours: 0,
  focusMinutes: 25,
  breakMinutes: 5,
  remaining: 25 * 60,
  isRunning: false,
  targetEndTime: null,
  isSoundMuted: false,
  updatedAt: Date.now()
};

/**
 * Reads local Pomodoro state, calculating accurate wall-clock remaining time if running.
 */
export function getPomodoroState() {
  try {
    const saved = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const focusHours = typeof parsed.focusHours === 'number' ? parsed.focusHours : 0;
      const focusMinutes = typeof parsed.focusMinutes === 'number' ? parsed.focusMinutes : 25;
      const breakMinutes = typeof parsed.breakMinutes === 'number' ? parsed.breakMinutes : 5;
      const mode = parsed.mode === 'break' ? 'break' : 'focus';
      const sessionCount = typeof parsed.sessionCount === 'number' ? parsed.sessionCount : 1;
      const isSoundMuted = Boolean(parsed.isSoundMuted);

      const totalFocusSec = (focusHours * 60 + focusMinutes) * 60;
      const totalBreakSec = breakMinutes * 60;
      const totalSec = mode === 'focus' ? totalFocusSec : totalBreakSec;

      let isRunning = Boolean(parsed.isRunning);
      let targetEndTime = parsed.targetEndTime || null;
      let remaining = typeof parsed.remaining === 'number' ? parsed.remaining : totalSec;

      // If timer is running, calculate live remaining from targetEndTime
      if (isRunning && targetEndTime) {
        const now = Date.now();
        const left = Math.round((targetEndTime - now) / 1000);
        if (left > 0) {
          remaining = left;
          isRunning = true;
        } else {
          // Finished
          remaining = 0;
          isRunning = false;
          targetEndTime = null;
        }
      } else {
        isRunning = false;
        targetEndTime = null;
      }

      return {
        mode,
        sessionCount,
        focusHours,
        focusMinutes,
        breakMinutes,
        remaining,
        isRunning,
        targetEndTime,
        isSoundMuted,
        updatedAt: parsed.updatedAt || Date.now()
      };
    }
  } catch (e) {
    console.warn('Failed to parse pomodoro local state:', e);
  }

  return { ...DEFAULT_POMODORO_STATE, updatedAt: Date.now() };
}

/**
 * Saves Pomodoro state to localStorage and immediately pushes to Firebase RTDB for multi-device sync.
 */
export async function savePomodoroState(newState, syncToCloud = true) {
  if (!newState) return;

  const payload = {
    mode: newState.mode === 'break' ? 'break' : 'focus',
    sessionCount: typeof newState.sessionCount === 'number' ? newState.sessionCount : 1,
    focusHours: typeof newState.focusHours === 'number' ? newState.focusHours : 0,
    focusMinutes: typeof newState.focusMinutes === 'number' ? newState.focusMinutes : 25,
    breakMinutes: typeof newState.breakMinutes === 'number' ? newState.breakMinutes : 5,
    remaining: typeof newState.remaining === 'number' ? newState.remaining : 1500,
    isRunning: Boolean(newState.isRunning),
    targetEndTime: newState.targetEndTime || null,
    isSoundMuted: Boolean(newState.isSoundMuted),
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(payload));
    notify();

    // Push to Firebase Realtime Database
    if (syncToCloud && !isApplyingCloudUpdate) {
      const uid = currentUid || getCurrentUser()?.uid;
      if (uid && rtdb) {
        const pomoRef = ref(rtdb, `users/${uid}/pomodoro`);
        await set(pomoRef, payload);
      }
    }
  } catch (e) {
    console.warn('Failed to save or sync pomodoro state:', e);
  }
}

/**
 * Subscribes to local pomodoro updates (across components or tabs)
 */
export function subscribePomodoroStore(callback) {
  const handler = () => callback(getPomodoroState());
  window.addEventListener(POMODORO_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(POMODORO_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Establishes Realtime Database listener for users/{uid}/pomodoro
 */
function setupPomodoroRTDBSync(uid) {
  if (activeUnsub) {
    try { activeUnsub(); } catch {}
    activeUnsub = null;
  }

  if (!uid || !rtdb) return;

  const pomoRef = ref(rtdb, `users/${uid}/pomodoro`);
  activeUnsub = onValue(pomoRef, (snapshot) => {
    const cloudVal = snapshot.val();
    if (cloudVal && typeof cloudVal === 'object') {
      const localState = getPomodoroState();

      // Only apply if cloud data is newer or has changed run state
      const isDifferent = 
        localState.isRunning !== Boolean(cloudVal.isRunning) ||
        localState.mode !== cloudVal.mode ||
        localState.targetEndTime !== (cloudVal.targetEndTime || null) ||
        Math.abs(localState.remaining - (cloudVal.remaining || 0)) > 2 ||
        localState.focusMinutes !== cloudVal.focusMinutes ||
        localState.breakMinutes !== cloudVal.breakMinutes ||
        localState.sessionCount !== cloudVal.sessionCount;

      if (isDifferent) {
        isApplyingCloudUpdate = true;
        try {
          let isRunning = Boolean(cloudVal.isRunning);
          let targetEndTime = cloudVal.targetEndTime || null;
          let remaining = typeof cloudVal.remaining === 'number' ? cloudVal.remaining : 1500;

          if (isRunning && targetEndTime) {
            const now = Date.now();
            const left = Math.round((targetEndTime - now) / 1000);
            if (left > 0) {
              remaining = left;
              isRunning = true;
            } else {
              remaining = 0;
              isRunning = false;
              targetEndTime = null;
            }
          }

          const merged = {
            mode: cloudVal.mode === 'break' ? 'break' : 'focus',
            sessionCount: typeof cloudVal.sessionCount === 'number' ? cloudVal.sessionCount : 1,
            focusHours: typeof cloudVal.focusHours === 'number' ? cloudVal.focusHours : 0,
            focusMinutes: typeof cloudVal.focusMinutes === 'number' ? cloudVal.focusMinutes : 25,
            breakMinutes: typeof cloudVal.breakMinutes === 'number' ? cloudVal.breakMinutes : 5,
            remaining,
            isRunning,
            targetEndTime,
            isSoundMuted: Boolean(cloudVal.isSoundMuted),
            updatedAt: cloudVal.updatedAt || Date.now()
          };

          localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(merged));
          notify();
        } finally {
          isApplyingCloudUpdate = false;
        }
      }
    } else {
      // Cloud is empty for this user: seed cloud with current local state
      const localState = getPomodoroState();
      set(pomoRef, { ...localState, updatedAt: Date.now() }).catch(() => {});
    }
  }, (err) => {
    console.warn('Pomodoro RTDB listener warning:', err);
  });
}

// Global Auth State Observer
if (typeof window !== 'undefined') {
  subscribeAuth((user) => {
    currentUid = user?.uid || null;
    if (user?.uid) {
      setupPomodoroRTDBSync(user.uid);
    } else {
      if (activeUnsub) {
        try { activeUnsub(); } catch {}
        activeUnsub = null;
      }
    }
  });
}
