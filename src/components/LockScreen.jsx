import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Wifi, AlertCircle, ShieldCheck } from 'lucide-react';
import { verifyPasscode, checkLockout, getRemainingAttempts } from '../services/security';
import { networkTrust } from '../services/networkTrust';
import { sound } from '../services/sound';

export default function LockScreen({ onUnlocked }) {
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [trustInfo, setTrustInfo] = useState(() => ({
    status: networkTrust.getStatus(),
    isTrusted: networkTrust.isTrustedNetwork()
  }));

  // Track network trust status in real time
  useEffect(() => {
    return networkTrust.subscribe((state) => {
      setTrustInfo(state);
      // If reconnected to trusted Wi-Fi, inform user
      if (state.isTrusted) {
        setErrorMsg('');
      }
    });
  }, []);

  // Check lockout
  useEffect(() => {
    const updateLockout = () => {
      const remainingMs = checkLockout();
      setLockoutSecs(Math.ceil(remainingMs / 1000));
    };
    updateLockout();
    const interval = setInterval(updateLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lockoutSecs > 0) return;

      if (e.key >= '0' && e.key <= '9') {
        if (passcode.length < 6) {
          sound.playTick();
          setPasscode(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        sound.playTick();
        setPasscode(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (passcode.length >= 4) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passcode, lockoutSecs]);

  // Auto-submit when 4 or 6 digits entered
  useEffect(() => {
    if (passcode.length === 4 || passcode.length === 6) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [passcode]);

  const handleSubmit = async () => {
    if (!passcode || isVerifying || lockoutSecs > 0) return;

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await verifyPasscode(passcode);
      if (res.success) {
        networkTrust.unlock();
        onUnlocked?.();
      } else {
        sound.playTick();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setPasscode('');

        if (res.lockedOut) {
          setLockoutSecs(res.remainingSecs);
          setErrorMsg(`Locked out. Try again in ${res.remainingSecs}s.`);
        } else {
          setErrorMsg(`Invalid passcode. ${res.remainingAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      console.error('Error verifying passcode:', err);
      setErrorMsg('Verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitClick = (num) => {
    if (lockoutSecs > 0 || passcode.length >= 6) return;
    sound.playTick();
    setPasscode(prev => prev + num);
  };

  const handleBackspace = () => {
    sound.playTick();
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playTick();
    setPasscode('');
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 bg-[#050608]/92 backdrop-blur-2xl select-none animate-modal-in"
      style={{
        perspective: '1000px'
      }}
    >
      {/* Background Soft Refraction */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%)'
        }}
      />

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-white/90 uppercase mb-8 drop-shadow-md">
        LIFE OF BLOCKS
      </h1>

      {/* 3D Liquid Smoked Glass Lock Card */}
      <div 
        className={`w-full max-w-sm p-6 sm:p-8 rounded-[32px] border border-white/20 shadow-2xl relative overflow-hidden flex flex-col items-center text-center transition-transform duration-200 ${
          isShaking ? 'translate-x-[-8px]' : ''
        }`}
        style={{
          background: 'linear-gradient(135deg, rgba(22, 25, 34, 0.8) 0%, rgba(12, 14, 20, 0.92) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: `
            0 32px 64px -16px rgba(0, 0, 0, 0.85),
            inset 0 1px 2px rgba(255, 255, 255, 0.25),
            inset 0 -1px 2px rgba(0, 0, 0, 0.6)
          `
        }}
      >
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-inner text-white">
          <Lock className="w-8 h-8 stroke-[1.8] text-white/90" />
        </div>

        <h2 className="text-lg font-semibold text-white tracking-wide mb-1">
          Workspace Locked
        </h2>
        <p className="text-xs text-white/50 tracking-wide mb-5 max-w-xs leading-relaxed">
          Connect to your trusted Wi-Fi or enter your passcode to regain access.
        </p>

        {/* Network Status Badge */}
        <div className="mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-mono">
          {trustInfo.isTrusted ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Trusted Wi-Fi Detected</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-white/50">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Untrusted Network</span>
            </span>
          )}
        </div>

        {/* Instant Unlock Button when reconnected to trusted Wi-Fi */}
        {trustInfo.isTrusted && (
          <button
            onClick={() => {
              networkTrust.unlock();
              onUnlocked?.();
            }}
            className="w-full mb-6 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Instant Unlock (Trusted Wi-Fi)</span>
          </button>
        )}

        {/* Passcode Dots Display (4 to 6 digits) */}
        <div className="flex items-center justify-center gap-3.5 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = passcode.length > idx;
            return (
              <div 
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled 
                    ? 'bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                    : 'bg-white/15 border border-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* Error / Lockout Feedback */}
        {errorMsg && (
          <p className="text-xs text-rose-300 font-medium mb-4 flex items-center justify-center gap-1.5 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Numeric On-Screen Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[220px] mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigitClick(String(num))}
              disabled={lockoutSecs > 0}
              className="h-11 rounded-2xl bg-white/[0.05] hover:bg-white/[0.14] active:scale-95 border border-white/10 text-white font-mono text-base font-medium transition-all cursor-pointer flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={lockoutSecs > 0 || passcode.length === 0}
            className="h-11 rounded-2xl bg-white/[0.02] hover:bg-white/[0.1] active:scale-95 border border-white/5 text-white/50 text-xs font-medium transition-all cursor-pointer flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigitClick('0')}
            disabled={lockoutSecs > 0}
            className="h-11 rounded-2xl bg-white/[0.05] hover:bg-white/[0.14] active:scale-95 border border-white/10 text-white font-mono text-base font-medium transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={lockoutSecs > 0 || passcode.length === 0}
            className="h-11 rounded-2xl bg-white/[0.02] hover:bg-white/[0.1] active:scale-95 border border-white/5 text-white/60 text-xs font-medium transition-all cursor-pointer flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        <p className="mt-4 text-[11px] text-white/40 font-mono">
          Default initial passcode is <span className="text-white/70">1234</span>
        </p>
      </div>
    </div>
  );
}
