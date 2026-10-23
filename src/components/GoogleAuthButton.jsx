import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Loader2, Mail, Lock, X, Sparkles, Check, AlertCircle, Copy, Smartphone, Monitor } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { 
  subscribeAuth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser 
} from '../services/firebase';
import { getSyncStatus, subscribeSyncStatus } from '../services/storage';

export default function GoogleAuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [sync, setSync] = useState(getSyncStatus());

  // Email/Password form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setIsSigningIn(false);
      if (currentUser) {
        setIsModalOpen(false);
        setErrorMessage('');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubSync = subscribeSyncStatus((s) => setSync(s));
    return () => unsubSync();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      setErrorMessage('');
      await signInWithGoogle();
    } catch (err) {
      console.warn('Google sign-in exception:', err);
      setIsModalOpen(true);
      if (err?.message && !err.message.includes('popup-closed')) {
        let msg = err.message.replace('Firebase:', '').trim();
        setErrorMessage(msg);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setIsModalOpen(false);
    } catch (err) {
      let msg = err.message || 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setIsMenuOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center">
        <Loader2 className="w-3.5 h-3.5 text-white/50 animate-spin" />
      </div>
    );
  }

  // User is LOGGED IN -> Minimal Avatar + Verified Profile Menu
  if (user) {
    const isNative = Capacitor.isNativePlatform();

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(prev => !prev)}
          title={`${user.displayName || user.email} (Click for Account & Sync Details)`}
          aria-label="Account"
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-emerald-400/80 hover:border-emerald-300 shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center bg-black/40 backdrop-blur-md"
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xs font-semibold text-white">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </span>
          )}
        </button>

        {/* Minimalist Liquid Glass Account Popover */}
        {isMenuOpen && (
          <div 
            className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-white/15 p-3.5 shadow-2xl backdrop-blur-2xl z-50 animate-modal-in select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.96) 0%, rgba(10, 12, 16, 0.98) 100%)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.15)'
            }}
          >
            {/* User Profile Header */}
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="" 
                      className="w-9 h-9 rounded-full object-cover border border-emerald-400/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white border border-emerald-400/50">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black/80 shadow-[0_0_6px_#34d399]" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.displayName || 'Google User'}
                  </p>
                  <p className="text-[11px] text-white/50 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleSignOut}
                title="Logout"
                aria-label="Logout"
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-white/60 hover:text-rose-300 transition-all cursor-pointer flex-shrink-0 active:scale-90"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Auth UID & Backend Consistency Proof */}
            <div className="mt-3 pt-1 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-white/60">
                <span className="font-mono text-[10px] uppercase tracking-wider">Firebase Auth UID</span>
                <button
                  onClick={handleCopyUid}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer active:scale-95"
                >
                  {copiedUid ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedUid ? 'Copied' : 'Copy UID'}
                </button>
              </div>

              <div className="p-2 rounded-lg bg-black/50 border border-white/10 font-mono text-[10px] text-white/80 break-all select-all">
                {user.uid}
              </div>

              {/* Platform Info */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-white/50">
                <span className="flex items-center gap-1">
                  {isNative ? <Smartphone className="w-3 h-3 text-sky-400" /> : <Monitor className="w-3 h-3 text-sky-400" />}
                  Platform
                </span>
                <span className="text-white/80 font-medium">
                  {isNative ? 'Android APK' : (window.innerWidth < 640 ? 'Mobile Web' : 'Desktop Web')}
                </span>
              </div>

              {/* Database Target */}
              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>Database Source</span>
                <span className="text-emerald-400 font-medium">
                  Firebase RTDB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User is NOT logged in -> Sleek Google 'G' icon button + Fallback Dialog
  return (
    <>
      <button
        onClick={handleGoogleClick}
        disabled={isSigningIn}
        title="Sign in with Google to sync across all devices"
        aria-label="Sign in"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/65 border border-white/15 hover:border-white/35 backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer shadow-lg active:scale-95 select-none group"
      >
        {isSigningIn ? (
          <Loader2 className="w-3.5 h-3.5 text-white/70 animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
      </button>

      {/* Universal Sign-In Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-modal-in select-none"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm p-6 rounded-[22px] border border-white/20 shadow-2xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(22, 26, 34, 0.96) 0%, rgba(12, 14, 18, 0.98) 100%)',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Sign in to Life of Blocks
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              Sign in with Google to synchronize your Blocks, Tasks, Files, and Wallpapers across all your devices in real-time.
            </p>

            <button
              onClick={handleGoogleClick}
              disabled={isSigningIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-lg hover:bg-zinc-100 transition-all active:scale-[0.98] cursor-pointer mb-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              Continue with Google
            </button>

            {errorMessage && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] leading-snug">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
