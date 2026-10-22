import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Loader2, Check } from 'lucide-react';
import { subscribeAuth, signInWithGoogle, signOutUser } from '../services/firebase';

export default function GoogleAuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const unsub = subscribeAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setIsSigningIn(false);
    });
    return () => unsub();
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

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.warn('Sign in dismissed or failed:', err);
    } finally {
      setIsSigningIn(false);
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

  // User is logged in -> Minimal Avatar with online dot
  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(prev => !prev)}
          title={`Signed in as ${user.displayName || user.email}`}
          aria-label="Google Account"
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white/20 hover:border-white/40 shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center bg-black/40 backdrop-blur-md"
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

          {/* Real-time Cloud Sync Emerald Indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black/80 shadow-[0_0_8px_#34d399]" />
        </button>

        {/* Minimalist Liquid Glass Account Menu */}
        {isMenuOpen && (
          <div 
            className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-white/15 p-3.5 shadow-2xl backdrop-blur-2xl z-50 animate-modal-in select-none"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.94) 0%, rgba(10, 12, 16, 0.97) 100%)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15)'
            }}
          >
            {/* User Info */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {user.displayName || 'Google User'}
                </p>
                <p className="text-[11px] text-white/50 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Sync Status Badge */}
            <div className="flex items-center gap-2 py-2.5 px-2 mt-1 rounded-xl bg-white/[0.03] text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
              <span className="truncate">Synced with Firestore</span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 text-xs font-medium transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // User is NOT logged in -> Sleek Google 'G' icon button
  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      title="Sign in with Google"
      aria-label="Sign in with Google"
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
  );
}
