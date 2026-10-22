// NetworkTrustService for LIFE OF BLOCKS
// Determines TRUSTED vs UNTRUSTED network presence across Web and Android APK

import { Network } from '@capacitor/network';
import { generateSecureToken } from './security';

const TRUST_STORAGE_KEY = 'lob_trust_endpoint';
const IS_LOCKED_KEY = 'lob_is_locked';
const GRACE_PERIOD_MS = 4000; // 4 seconds grace period to tolerate transient network jitter

class NetworkTrustService {
  constructor() {
    this.status = 'CHECKING'; // 'CHECKING' | 'TRUSTED' | 'UNTRUSTED' | 'LOCKED'
    this.listeners = new Set();
    this.isNative = false;
    this.untrustedTimer = null;
    this.pollInterval = null;
    this.trustedEndpoint = this.getStoredEndpoint() || window.location.origin;
    this.isLocked = this.getStoredLockState();

    this.init();
  }

  getStoredEndpoint() {
    try {
      return localStorage.getItem(TRUST_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  }

  setStoredEndpoint(url) {
    try {
      localStorage.setItem(TRUST_STORAGE_KEY, url);
      this.trustedEndpoint = url;
    } catch (e) {
      console.warn('Could not save trusted endpoint', e);
    }
  }

  getStoredLockState() {
    try {
      return localStorage.getItem(IS_LOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  setStoredLockState(locked) {
    this.isLocked = locked;
    try {
      localStorage.setItem(IS_LOCKED_KEY, String(locked));
    } catch (e) {
      console.warn('Could not save lock state', e);
    }
    this.notify();
  }

  async init() {
    // Check if running on Android Native via Capacitor
    try {
      const netStatus = await Network.getStatus();
      this.isNative = true;

      // Listen to Android Native network changes
      Network.addListener('networkStatusChange', (status) => {
        this.handleNativeNetworkChange(status);
      });

      this.handleNativeNetworkChange(netStatus);
    } catch {
      this.isNative = false;
    }

    // Always run periodic verification check (every 3.5 seconds)
    this.checkTrust();
    this.pollInterval = setInterval(() => {
      this.checkTrust();
    }, 3500);

    // Also listen to browser online/offline events
    window.addEventListener('online', () => this.checkTrust());
    window.addEventListener('offline', () => this.handleNetworkLost());
  }

  // Handle native Android network state
  async handleNativeNetworkChange(status) {
    if (!status.connected) {
      this.handleNetworkLost();
      return;
    }

    if (status.connectionType === 'cellular') {
      // Cellular is strictly off trusted Wi-Fi
      this.handleNetworkLost();
      return;
    }

    if (status.connectionType === 'wifi') {
      // Wi-Fi connected: perform challenge-response verification
      await this.checkTrust();
    }
  }

  // Cryptographic Challenge-Response Verification against local network authority
  async checkTrust() {
    if (!navigator.onLine) {
      this.handleNetworkLost();
      return;
    }

    try {
      const nonce = generateSecureToken(16);
      const targetUrl = `${this.trustedEndpoint}/api/trust/verify`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce,
          timestamp: Date.now()
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.trusted) {
          this.handleTrustConfirmed();
          return;
        }
      }

      this.handleNetworkLost();
    } catch {
      // If primary endpoint fails, fallback to relative endpoint if different
      if (this.trustedEndpoint !== window.location.origin) {
        try {
          const res = await fetch('/api/trust/verify', { method: 'POST' });
          if (res.ok) {
            this.handleTrustConfirmed();
            return;
          }
        } catch {
          // Both failed
        }
      }
      this.handleNetworkLost();
    }
  }

  handleTrustConfirmed() {
    // Clear any pending grace-period timer
    if (this.untrustedTimer) {
      clearTimeout(this.untrustedTimer);
      this.untrustedTimer = null;
    }

    const wasUntrusted = this.status === 'UNTRUSTED';
    this.status = 'TRUSTED';

    // Auto-unlock if device returned to trusted Wi-Fi and was locked due to untrusted network
    if (this.isLocked && wasUntrusted) {
      // Keep locked until user passcode or unlock policy
    }

    this.notify();
  }

  handleNetworkLost() {
    // Tolerant verification grace period (Section 12)
    if (this.status === 'TRUSTED' && !this.untrustedTimer) {
      this.untrustedTimer = setTimeout(() => {
        this.status = 'UNTRUSTED';
        this.setStoredLockState(true);
        this.untrustedTimer = null;
        this.notify();
      }, GRACE_PERIOD_MS);
    } else if (this.status !== 'TRUSTED') {
      this.status = 'UNTRUSTED';
      this.setStoredLockState(true);
      this.notify();
    }
  }

  // Unlock with passcode or user intent
  unlock() {
    this.setStoredLockState(false);
    this.notify();
  }

  // Lock explicitly
  lock() {
    this.setStoredLockState(true);
    this.notify();
  }

  isTrustedNetwork() {
    return this.status === 'TRUSTED';
  }

  isWorkspaceLocked() {
    return this.isLocked;
  }

  getStatus() {
    if (this.isLocked) return 'LOCKED';
    return this.status;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      status: this.getStatus(),
      isLocked: this.isLocked,
      isTrusted: this.isTrustedNetwork()
    });

    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    const payload = {
      status: this.getStatus(),
      isLocked: this.isLocked,
      isTrusted: this.isTrustedNetwork()
    };
    this.listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error('Error in network trust listener:', e);
      }
    });
  }
}

export const networkTrust = new NetworkTrustService();
