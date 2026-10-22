// Cryptographic Security & Passcode Service for LIFE OF BLOCKS
// Implements Web Crypto API PBKDF2/SHA-256 salted hashing, device identities, and pairing tokens

const PASSCODE_HASH_KEY = 'lob_sec_passcode_hash';
const PASSCODE_SALT_KEY = 'lob_sec_passcode_salt';
const WORKSPACE_ID_KEY = 'lob_sec_workspace_id';
const WORKSPACE_SECRET_KEY = 'lob_sec_workspace_secret';
const DEVICE_IDENTITY_KEY = 'lob_sec_device_identity';
const PAIRED_DEVICES_KEY = 'lob_sec_paired_devices';
const FAILED_ATTEMPTS_KEY = 'lob_sec_failed_attempts';

// Default initial passcode is 1234 (hashed on first launch, user prompted to change)
const DEFAULT_PASSCODE = '1234';

// Helper: Convert ArrayBuffer to Hex string
function bufToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert string to ArrayBuffer
function strToBuf(str) {
  return new TextEncoder().encode(str);
}

// Generate cryptographically secure random salt/token
export function generateSecureToken(length = 16) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return bufToHex(array);
}

// Cryptographic Salted Hash for Passcode (SHA-256 with 10,000 iterations PBKDF2)
export async function hashPasscode(passcode, salt) {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    strToBuf(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: strToBuf(salt),
      iterations: 10000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bufToHex(derivedBits);
}

// Initialize workspace security identities if not yet created
export async function initWorkspaceSecurity() {
  let workspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
  let workspaceSecret = localStorage.getItem(WORKSPACE_SECRET_KEY);

  if (!workspaceId || !workspaceSecret) {
    workspaceId = 'ws_' + generateSecureToken(8);
    workspaceSecret = generateSecureToken(32);
    localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
    localStorage.setItem(WORKSPACE_SECRET_KEY, workspaceSecret);
  }

  // Initialize Passcode if none exists
  let passHash = localStorage.getItem(PASSCODE_HASH_KEY);
  let passSalt = localStorage.getItem(PASSCODE_SALT_KEY);

  if (!passHash || !passSalt) {
    passSalt = generateSecureToken(16);
    passHash = await hashPasscode(DEFAULT_PASSCODE, passSalt);
    localStorage.setItem(PASSCODE_SALT_KEY, passSalt);
    localStorage.setItem(PASSCODE_HASH_KEY, passHash);
  }

  // Initialize Local Device Identity
  let device = getDeviceIdentity();
  if (!device) {
    // Detect human-friendly device name
    const ua = navigator.userAgent || '';
    let defaultName = 'Laptop Browser';
    if (/android/i.test(ua)) defaultName = 'Android App';
    else if (/iphone|ipad|ipod/i.test(ua)) defaultName = 'Phone Browser';
    else if (/macintosh/i.test(ua)) defaultName = 'Mac Laptop';
    else if (/windows/i.test(ua)) defaultName = 'Windows Laptop';

    device = {
      id: 'dev_' + generateSecureToken(6),
      name: defaultName,
      isRoot: true,
      registeredAt: Date.now(),
      lastActive: Date.now()
    };
    saveDeviceIdentity(device);
    registerPairedDevice(device);
  }

  return { workspaceId, device };
}

// Device Identity
export function getDeviceIdentity() {
  try {
    const raw = localStorage.getItem(DEVICE_IDENTITY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDeviceIdentity(dev) {
  try {
    localStorage.setItem(DEVICE_IDENTITY_KEY, JSON.stringify(dev));
  } catch (e) {
    console.error('Failed to save device identity:', e);
  }
}

// Paired Devices List
export function getPairedDevices() {
  try {
    const raw = localStorage.getItem(PAIRED_DEVICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerPairedDevice(device) {
  const devices = getPairedDevices();
  const existingIdx = devices.findIndex(d => d.id === device.id);
  if (existingIdx >= 0) {
    devices[existingIdx] = { ...devices[existingIdx], ...device, lastActive: Date.now() };
  } else {
    devices.push({ ...device, lastActive: Date.now() });
  }
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices));
}

export function removePairedDevice(deviceId) {
  const devices = getPairedDevices().filter(d => d.id !== deviceId);
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices));
}

// Passcode Verification with Rate Limiting
export async function verifyPasscode(inputPasscode) {
  // Check lockout status
  const lockoutUntil = checkLockout();
  if (lockoutUntil > 0) {
    return { success: false, lockedOut: true, remainingSecs: Math.ceil(lockoutUntil / 1000) };
  }

  const passSalt = localStorage.getItem(PASSCODE_SALT_KEY);
  const storedHash = localStorage.getItem(PASSCODE_HASH_KEY);

  if (!passSalt || !storedHash) {
    return { success: false, error: 'Passcode not configured.' };
  }

  const computedHash = await hashPasscode(inputPasscode, passSalt);
  if (computedHash === storedHash) {
    // Reset failed attempts upon success
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    return { success: true };
  } else {
    // Increment failed attempts
    recordFailedAttempt();
    return { success: false, lockedOut: false, remainingAttempts: getRemainingAttempts() };
  }
}

// Update Passcode
export async function setPasscode(newPasscode) {
  const newSalt = generateSecureToken(16);
  const newHash = await hashPasscode(newPasscode, newSalt);
  localStorage.setItem(PASSCODE_SALT_KEY, newSalt);
  localStorage.setItem(PASSCODE_HASH_KEY, newHash);
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  return true;
}

// Rate Limiting (5 attempts -> 30s lockout)
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000;

function getFailedAttempts() {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : { count: 0, lockoutTime: 0 };
  } catch {
    return { count: 0, lockoutTime: 0 };
  }
}

function recordFailedAttempt() {
  const state = getFailedAttempts();
  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
  }
  localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(state));
}

export function checkLockout() {
  const state = getFailedAttempts();
  if (state.lockoutTime && Date.now() < state.lockoutTime) {
    return state.lockoutTime - Date.now();
  }
  if (state.lockoutTime && Date.now() >= state.lockoutTime) {
    // Reset after lockout expired
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  }
  return 0;
}

export function getRemainingAttempts() {
  const state = getFailedAttempts();
  return Math.max(0, MAX_ATTEMPTS - state.count);
}

// Pairing Token Generator
export function generatePairingPayload() {
  const workspaceId = localStorage.getItem(WORKSPACE_ID_KEY) || 'ws_lob';
  const secret = localStorage.getItem(WORKSPACE_SECRET_KEY) || generateSecureToken(16);
  const localHost = window.location.hostname || '192.168.1.6';
  const localPort = window.location.port || '5173';

  // 6-digit short code derived from workspace secret
  const shortCode = String(Math.abs(parseInt(secret.slice(0, 8), 16)) % 1000000).padStart(6, '0');

  const pairingData = {
    workspaceId,
    secret,
    trustedHost: `${localHost}:${localPort}`,
    shortCode,
    created: Date.now()
  };

  return {
    shortCode,
    pairingUrl: `http://${localHost}:${localPort}/?pair=${encodeURIComponent(btoa(JSON.stringify(pairingData)))}`,
    pairingData
  };
}
