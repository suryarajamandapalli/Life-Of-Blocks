// NetworkTrustService for LIFE OF BLOCKS
// Determines TRUSTED vs UNTRUSTED network presence for Wi-Fi 'Airtel_MSR' across Web and Android APK

import { Network } from '@capacitor/network';
import { generateSecureToken, MASTER_PIN } from './security';

const TRUST_STORAGE_KEY = 'lob_trust_endpoint';
const IS_LOCKED_KEY = 'lob_is_locked';
const GRACE_PERIOD_MS = 5000;

class NetworkTrustService {
  constructor() {
    this.status = 'CHECKING'; // 'CHECKING' | 'TRUSTED' | 'UNTRUSTED' | 'LOCKED'
    this.listeners = new Set();
    this.isNative = false;
    this.untrustedTimer = null;
    this.pollInterval = null;
    this.trustedEndpoint = this.getStoredEndpoint() || 'http://192.168.1.6:5173';
    this.isLocked = this.getStoredLockState();
    this.isSessionUnlocked = false; // Once unlocked with PIN 3782, stays unlocked for this session

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
      // Default to unlocked on initial load
      const val = localStorage.getItem(IS_LOCKED_KEY);
      return val === 'true';
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
    // 1. Check if running on Android Native via Capacitor
    try {
      const netStatus = await Network.getStatus();
      this.isNative = true;

      Network.addListener('networkStatusChange', (status) => {
        this.handleNativeNetworkChange(status);
      });

      this.handleNativeNetworkChange(netStatus);
    } catch {
      this.isNative = false;
    }

    // 2. Perform initial check
    await this.checkTrust();

    // 3. Periodic verification check (every 10s instead of rapid loop)
    this.pollInterval = setInterval(() => {
      this.checkTrust();
    }, 10000);

    // 4. Online/offline events
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
      // Cellular data is outside trusted home Wi-Fi Airtel_MSR
      this.handleNetworkLost();
      return;
    }

    if (status.connectionType === 'wifi') {
      await this.checkTrust();
    }
  }

  // Verification against local network authority (192.168.1.6:5173 or current host)
  async checkTrust() {
    if (!navigator.onLine) {
      this.handleNetworkLost();
      return;
    }

    // If running directly on the laptop on LAN (192.168.1.6 or localhost)
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '192.168.1.6';

    if (isLocalhost) {
      this.handleTrustConfirmed();
      return;
    }

    // Try probing the trusted laptop host on Airtel_MSR LAN
    const endpointsToTry = [
      this.trustedEndpoint,
      'http://192.168.1.6:5173',
      '/api/trust/verify'
    ];

    for (const ep of endpointsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const url = ep.endsWith('/verify') ? ep : `${ep}/api/trust/verify`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nonce: generateSecureToken(8), timestamp: Date.now() }),
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
      } catch {
        // Continue to next probe
      }
    }

    // If all probes fail: device is not on Airtel_MSR Wi-Fi LAN
    this.handleNetworkLost();
  }

  handleTrustConfirmed() {
    if (this.untrustedTimer) {
      clearTimeout(this.untrustedTimer);
      this.untrustedTimer = null;
    }

    const wasUntrusted = this.status === 'UNTRUSTED';
    this.status = 'TRUSTED';

    // Auto-unlock when connected to trusted Wi-Fi Airtel_MSR!
    if (this.isLocked && wasUntrusted) {
      this.setStoredLockState(false);
    }

    this.notify();
  }

  handleNetworkLost() {
    // If user unlocked once with PIN 3782, DO NOT lock them out while active in this session!
    if (this.isSessionUnlocked) {
      this.status = 'UNTRUSTED';
      this.notify();
      return;
    }

    // Only lock if not session-unlocked
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

  // Unlock with PIN (e.g. 3782)
  unlock() {
    this.isSessionUnlocked = true;
    this.setStoredLockState(false);
    this.notify();
  }

  // Lock explicitly
  lock() {
    this.isSessionUnlocked = false;
    this.setStoredLockState(true);
    this.notify();
  }

  isTrustedNetwork() {
    return this.status === 'TRUSTED';
  }

  isWorkspaceLocked() {
    // If session unlocked with PIN 3782, never locked
    if (this.isSessionUnlocked) return false;
    return this.isLocked;
  }

  getStatus() {
    if (this.isWorkspaceLocked()) return 'LOCKED';
    return this.status;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      status: this.getStatus(),
      isLocked: this.isWorkspaceLocked(),
      isTrusted: this.isTrustedNetwork()
    });

    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    const payload = {
      status: this.getStatus(),
      isLocked: this.isWorkspaceLocked(),
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