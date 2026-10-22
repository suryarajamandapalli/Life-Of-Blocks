import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Wifi, 
  Smartphone, 
  Laptop, 
  KeyRound, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink 
} from 'lucide-react';
import { 
  getDeviceIdentity, 
  saveDeviceIdentity, 
  getPairedDevices, 
  removePairedDevice, 
  setPasscode, 
  generatePairingPayload,
  MASTER_PIN 
} from '../services/security';
import { networkTrust } from '../services/networkTrust';

export default function SecuritySettingsModal({ isOpen, onClose }) {
  const [device, setDevice] = useState(getDeviceIdentity);
  const [deviceName, setDeviceName] = useState(device?.name || 'Windows Laptop');
  const [pairedDevices, setPairedDevices] = useState(getPairedDevices);
  const [trustState, setTrustState] = useState(() => ({
    status: networkTrust.getStatus(),
    isTrusted: networkTrust.isTrustedNetwork()
  }));

  // Passcode change states
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // Pairing state
  const [pairingPayload, setPairingPayload] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    return networkTrust.subscribe(setTrustState);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDevice(getDeviceIdentity());
      setPairedDevices(getPairedDevices());
      setPairingPayload(generatePairingPayload());
      setPassMsg('');
      setNewPass('');
      setConfirmPass('');
    }
  }, [isOpen]);

  const handleSaveDeviceName = (e) => {
    e.preventDefault();
    if (!deviceName.trim() || !device) return;
    const updated = { ...device, name: deviceName.trim() };
    saveDeviceIdentity(updated);
    setDevice(updated);
  };

  const handleChangePasscode = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 4) {
      setPassMsg('Passcode must be at least 4 digits.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg('Passcodes do not match.');
      return;
    }

    await setPasscode(newPass);
    setPassMsg('Passcode updated successfully!');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassMsg(''), 2500);
  };

  const handleCopyPairUrl = () => {
    if (pairingPayload?.pairingUrl) {
      navigator.clipboard.writeText(pairingPayload.pairingUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-modal-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg p-6 sm:p-7 rounded-[28px] liquid-glass-modal shadow-2xl border border-white/15 flex flex-col max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 flex-shrink-0">
          <div className="flex items-center gap-2.5 text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-semibold tracking-wide">
              Trusted Network & Security
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Trusted Network: Airtel_MSR */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-white/60">
              Trusted Wi-Fi
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-mono font-medium ${
              trustState.isTrusted ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${trustState.isTrusted ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
              <span>{trustState.isTrusted ? 'Airtel_MSR (Connected)' : 'Untrusted Network'}</span>
            </span>
          </div>
          <p className="text-xs text-white/50 leading-relaxed font-mono">
            Host: <span className="text-white/80">192.168.1.6:5173</span> · Master PIN: <span className="text-emerald-300 font-bold">{MASTER_PIN}</span>
          </p>
        </div>

        {/* 2. Device Pairing */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-white/60">
              Cross-Device Pairing
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">PIN: {MASTER_PIN}</span>
          </div>

          <p className="text-xs text-white/60 mb-3 leading-relaxed">
            Open this link on your phone (connected to Airtel_MSR) to sync tasks across both devices:
          </p>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl border border-white/10 font-mono text-xs text-white/90 truncate">
              {pairingPayload?.pairingUrl}
            </div>
            <button
              onClick={handleCopyPairUrl}
              className="px-3 py-2 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-md flex-shrink-0"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 3. Paired Devices */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <span className="text-xs font-semibold tracking-wider uppercase text-white/60 mb-3 block">
            Paired Devices
          </span>

          <div className="flex flex-col gap-2">
            {pairedDevices.map((dev) => (
              <div 
                key={dev.id} 
                className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-white/85"
              >
                <div className="flex items-center gap-2.5">
                  {dev.name.toLowerCase().includes('laptop') ? (
                    <Laptop className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  )}
                  <div>
                    <span className="font-medium text-white">{dev.name}</span>
                    {dev.id === device?.id && (
                      <span className="ml-2 text-[10px] text-emerald-400 font-mono font-medium">(This Device)</span>
                    )}
                  </div>
                </div>

                {dev.id !== device?.id && (
                  <button
                    onClick={() => {
                      removePairedDevice(dev.id);
                      setPairedDevices(getPairedDevices());
                    }}
                    title="Remove device"
                    className="p-1 rounded text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}