import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logOut } from '../../services/firebase';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      soundService.playTap();
      hapticsService.medium();

      await signInWithGoogle();
      soundService.playTaskComplete();
      hapticsService.success();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Check your connection.');
      } else {
        setErrorMsg(err.message || 'Unable to sign in with Google.');
      }
      hapticsService.error();
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      soundService.playTap();
      hapticsService.light();
      await logOut();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal glass auth-modal"
        style={{
          width: 'min(440px, 94vw)',
          padding: '32px 28px',
          borderRadius: '32px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            soundService.playTap();
            onClose();
          }}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--c-content)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {currentUser ? (
          /* Profile & Cloud Account Card */
          <div style={{ textAlign: 'center' }}>
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  margin: '0 auto 16px',
                  display: 'block',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#fff',
                  fontSize: '28px',
                  fontWeight: 600,
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
              </div>
            )}

            <h3
              style={{
                margin: '0 0 4px',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--c-content)',
                letterSpacing: '-0.3px',
              }}
            >
              {currentUser.displayName || 'Welcome back'}
            </h3>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: '14px',
                color: 'var(--c-muted)',
              }}
            >
              {currentUser.email}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '99em',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.28)',
                color: '#4ade80',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  display: 'inline-block',
                }}
              />
              Cloud Firestore Synced
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="create"
                onClick={onClose}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue to Blocks
              </button>

              <button
                type="button"
                className="cancel"
                onClick={handleSignOut}
                disabled={loading}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  color: '#ef4444',
                }}
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        ) : (
          /* Welcome & Google Onboarding Screen */
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 18px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-content)' }}>
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="14" width="7" height="7" rx="2" />
                <rect x="3" y="14" width="7" height="7" rx="2" />
              </svg>
            </div>

            <h3
              style={{
                margin: '0 0 8px',
                fontSize: '23px',
                fontWeight: 700,
                color: 'var(--c-content)',
                letterSpacing: '-0.5px',
              }}
            >
              Life of Blocks
            </h3>
            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14.5px',
                color: 'var(--c-muted)',
                lineHeight: 1.5,
              }}
            >
              Keep every little thing in its own place. Sign in with Google to synchronize your blocks, tasks, files, and personalized workspace in Cloud Firestore.
            </p>

            {/* Benefit Badges */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                textAlign: 'left',
                margin: '0 0 24px',
                padding: '14px 16px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                fontSize: '13px',
                color: 'var(--c-content)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px' }}>⚡</span>
                <span>Real-time Cloud Firestore synchronization</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px' }}>🔐</span>
                <span>Secure Google Authentication & private data</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px' }}>📱</span>
                <span>Cross-device sync for web and mobile Android app</span>
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '13px',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.20)',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                transition: 'transform 0.2s ease, opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {/* Google G Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.28-2.09 3.665-5.17 3.665-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>

            {/* Continue as Guest option */}
            <button
              type="button"
              onClick={() => {
                soundService.playTap();
                onClose();
              }}
              style={{
                marginTop: '14px',
                background: 'transparent',
                border: 0,
                color: 'var(--c-muted)',
                fontSize: '13.5px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Continue as Guest (Offline)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
