import React, { useState, useEffect } from 'react';
import { Lock, Delete } from 'lucide-react';
import { verifyPasscode } from '../services/security';
import { networkTrust } from '../services/networkTrust';
import { sound } from '../services/sound';

export default function LockScreen({ onUnlocked }) {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      handleVerify(pin);
    }
  }, [pin]);

  // Handle hardware keyboard typing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isVerifying) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          sound.playTick();
          setPin(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        sound.playTick();
        setPin(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isVerifying]);

  const handleVerify = async (codeToVerify) => {
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await verifyPasscode(codeToVerify);
      if (res.success) {
        sound.playTick();
        networkTrust.unlock();
        onUnlocked?.();
      } else {
        sound.playTick();
        setIsShaking(true);
        setErrorMsg('Incorrect PIN');
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
          setErrorMsg('');
        }, 600);
      }
    } catch {
      setErrorMsg('Error verifying');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigit = (digit) => {
    if (isVerifying || pin.length >= 4) return;
    sound.playTick();
    setPin(prev => prev + digit);
  };

  const handleBackspace = () => {
    sound.playTick();
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playTick();
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 bg-[#050608]/92 backdrop-blur-2xl select-none animate-fadeIn">
      {/* Container */}
      <div className={`w-full max-w-[280px] flex flex-col items-center text-center transition-transform duration-200 ${
        isShaking ? 'translate-x-[-8px]' : ''
      }`}>
        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center mb-5 text-white/80 shadow-inner">
          <Lock className="w-5 h-5 stroke-[2]" />
        </div>

        {/* Title */}
        <h1 className="text-sm font-semibold tracking-[0.2em] text-white/90 uppercase mb-1">
          LIFE OF BLOCKS
        </h1>
        <p className="text-xs text-white/40 font-mono mb-6">
          {errorMsg || 'Enter PIN to unlock'}
        </p>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <span
              key={idx}
              className={`w-3 h-3 rounded-full transition-all duration-150 ${
                idx < pin.length
                  ? 'bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              className="h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] active:scale-95 border border-white/10 text-white text-lg font-medium transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 text-white/40 hover:text-white text-xs font-mono transition-all cursor-pointer flex items-center justify-center"
          >
            Clear
          </button>

          {/* 0 button */}
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] active:scale-95 border border-white/10 text-white text-lg font-medium transition-all cursor-pointer flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Backspace button */}
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 text-white/40 hover:text-white transition-all cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
}