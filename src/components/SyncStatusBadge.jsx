import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, WifiOff, CheckCircle2, Copy, Check, ExternalLink, X } from 'lucide-react';
import { getSyncStatus, subscribeSyncStatus } from '../services/storage';
import { getCurrentUser } from '../services/firebase';

export default function SyncStatusBadge() {
  const [sync, setSync] = useState(getSyncStatus());
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus((newStatus) => {
      setSync(newStatus);
    });
    return () => unsub();
  }, []);

  const user = getCurrentUser();

  const rulesSnippet = `{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(rulesSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Only render if user is logged in AND there is an error or permission issue that needs attention
  // Normal synced state is indicated by the green circle around account profile picture
  if (!user || sync.status === 'synced' || sync.status === 'syncing') return null;

  return (
    <>
      <button
        onClick={() => {
          if (sync.status === 'permission_denied' || sync.status === 'error') {
            setShowModal(true);
          }
        }}
        title={sync.message || `Sync Status: ${sync.status}`}
        className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 transition-all select-none cursor-pointer active:scale-95 ${
          sync.status === 'permission_denied'
            ? 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
            : sync.status === 'offline'
            ? 'bg-black/35 border-zinc-500/30 text-zinc-400'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}
      >
        {sync.status === 'permission_denied' && (
          <>
            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Rules Locked</span>
          </>
        )}

        {sync.status === 'offline' && (
          <>
            <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-400" />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Offline</span>
          </>
        )}

        {sync.status === 'error' && (
          <>
            <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400" />
            <span className="text-[10px] sm:text-[11px] font-medium tracking-wide">Sync Error</span>
          </>
        )}
      </button>

      {/* Helper Modal when Rules are locked in Firebase Console */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-modal-in select-none"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-md p-5 sm:p-6 rounded-[22px] border border-amber-500/30 shadow-2xl relative"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 20, 16, 0.98) 0%, rgba(14, 12, 10, 0.99) 100%)',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(251, 191, 36, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Firebase Database Rules Notice
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/80 leading-relaxed mb-3">
              Your Firebase Realtime Database is currently blocking read/write access. To enable instant live sync across your Laptop, Phone, and APK, paste these rules into your Firebase Console:
            </p>

            <div className="relative rounded-xl bg-black/60 border border-white/10 p-3 mb-3.5 font-mono text-[11px] text-amber-200/90 overflow-x-auto">
              <pre>{rulesSnippet}</pre>
              <button
                onClick={handleCopyRules}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white flex items-center gap-1 active:scale-95"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] text-white/60 mb-4">
              <p>1. Go to <span className="text-white font-medium">Firebase Console</span> → <span className="text-white font-medium">Realtime Database</span></p>
              <p>2. Click the <span className="text-white font-medium">Rules</span> tab</p>
              <p>3. Paste the snippet above and click <span className="text-amber-400 font-semibold">Publish</span></p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-all"
              >
                Close
              </button>
              <a
                href="https://console.firebase.google.com/project/life-of-blocks/database/life-of-blocks-default-rtdb/rules"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
              >
                Open Rules in Firebase <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
