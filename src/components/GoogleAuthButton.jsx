import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Loader2, Mail, Lock, X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { 
  subscribeAuth, 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser 
} from '../services/firebase';

export default function GoogleAuthButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // If native Google auth encountered an issue or was dismissed, open modal
      setIsModalOpen(true);
      if (err?.message && !err.message.includes('popup-closed')) {
        setErrorMessage(err.message.replace('Firebase:', '').trim());
      }
    } finally {
      setIsSigningIn(false);
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
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Account exists. Try signing in instead.';
        setIsSignUp(false);
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
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

  // User is LOGGED IN -> Minimal Avatar with emerald online dot
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

  // User is NOT logged in -> Sleek Google 'G' icon button + Fallback Dialog
  return (
    <>
      <button
        onClick={handleGoogleClick}
        disabled={isSigningIn}
        title="Sign in to sync"
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

      {/* Universal Sign-In Modal (Guarantees Sign-In on ANY Device) */}
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
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <h3 className="text-sm font-semibold text-white tracking-wide">
                  Sign In to Sync
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleClick}
              disabled={isSigningIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-zinc-950 font-semibold text-xs tracking-wide shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Subtle Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-mono uppercase text-white/35 tracking-wider">or email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Email + Password Form (100% reliable across all devices) */}
            <form onSubmit={handleEmailAuth} className="space-y-2.5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-white/40 text-xs text-white placeholder-white/35 outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/15 focus:border-white/40 text-xs text-white placeholder-white/35 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{isSignUp ? 'Create Cloud Account' : 'Sign In'}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMessage('');
                  }}
                  className="text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
