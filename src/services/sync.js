// Realtime Cross-Device Synchronization Engine for LIFE OF BLOCKS
// Syncs Blocks, Todos, and File metadata across Laptop, Phone, and Android APK on Airtel_MSR Wi-Fi

import { getBlocks, getTodos, getFilesMeta } from './storage';

class SyncEngine {
  constructor() {
    this.eventSource = null;
    this.listeners = new Set();
    this.syncEndpoint = this.getDefaultEndpoint();
    this.isConnected = false;
    this.reconnectTimer = null;

    this.init();
  }

  getDefaultEndpoint() {
    try {
      const stored = localStorage.getItem('lob_sync_endpoint');
      if (stored) return stored;
    } catch {}
    
    // If on localhost or laptop IP
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '192.168.1.6') {
        return window.location.origin;
      }
    }
    return 'http://192.168.1.6:5173';
  }

  setEndpoint(url) {
    if (!url) return;
    this.syncEndpoint = url;
    try {
      localStorage.setItem('lob_sync_endpoint', url);
    } catch {}
    this.reconnect();
  }

  init() {
    this.connectEventStream();
    this.hydrateFromHost();

    // Wire global broadcaster for storage changes
    if (typeof window !== 'undefined') {
      window.__lob_broadcast_change = (action, data) => {
        this.broadcastChange(action, data);
      };
    }
  }

  connectEventStream() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      const sseUrl = `${this.syncEndpoint}/api/sync/events`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncomingSync(payload);
        } catch (e) {
          console.warn('Failed to parse incoming sync event:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.eventSource.close();
        this.eventSource = null;

        // Auto-reconnect after 4s
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectEventStream();
          }, 4000);
        }
      };
    } catch {
      this.isConnected = false;
    }
  }

  reconnect() {
    this.connectEventStream();
  }

  // Handle incoming remote changes from another paired device
  handleIncomingSync(payload) {
    if (!payload || !payload.type) return;

    if (payload.type === 'FULL_STATE') {
      if (payload.blocks) {
        localStorage.setItem('lob_blocks', JSON.stringify(payload.blocks));
      }
      if (payload.todos) {
        localStorage.setItem('lob_todos', JSON.stringify(payload.todos));
      }
      if (payload.files) {
        localStorage.setItem('lob_files_meta', JSON.stringify(payload.files));
      }
      window.dispatchEvent(new Event('lob_storage_update'));
      return;
    }

    if (payload.type === 'UPDATE') {
      const { blocks, todos, files } = payload;
      if (blocks) localStorage.setItem('lob_blocks', JSON.stringify(blocks));
      if (todos) localStorage.setItem('lob_todos', JSON.stringify(todos));
      if (files) localStorage.setItem('lob_files_meta', JSON.stringify(files));
      window.dispatchEvent(new Event('lob_storage_update'));
    }
  }

  // Broadcast local change to all other devices on the trusted network
  async broadcastChange(action, data) {
    try {
      const blocks = getBlocks();
      const todos = getTodos();
      const files = getFilesMeta();

      await fetch(`${this.syncEndpoint}/api/sync/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data,
          blocks,
          todos,
          files,
          timestamp: Date.now(),
          deviceId: localStorage.getItem('lob_sec_device_identity') || 'unknown'
        })
      });
    } catch (e) {
      console.debug('Sync broadcast deferred (offline or host unavailable)', e);
    }
  }

  // Hydrate full state from local network host
  async hydrateFromHost() {
    try {
      const res = await fetch(`${this.syncEndpoint}/api/sync/state`);
      if (res.ok) {
        const state = await res.json();
        this.handleIncomingSync({ type: 'FULL_STATE', ...state });
        return true;
      }
    } catch {
      // Local host offline or not reachable
    }
    return false;
  }

  subscribeStatus(callback) {
    this.listeners.add(callback);
    callback(this.isConnected);
    return () => this.listeners.delete(callback);
  }

  notifyStatus(connected) {
    this.listeners.forEach((cb) => cb(connected));
  }
}

export const syncEngine = new SyncEngine();