// Web Audio API Sound Utility — Zero external assets, 100% offline

class SoundController {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Dual-tone harmonic chime for Pomodoro completion
  playTimerCompletion() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const frequencies = [528, 660, 792]; // Solfeggio / harmonious triad

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.9);
      });
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }

  // Soft click / tick sound
  playTick() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // Realistic glass stress crack sound for block breaking interaction
  playGlassCrack(level = 1) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // High-frequency crystal snap
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(level === 1 ? 2200 : 3200, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(level === 1 ? 1900 : 2700, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.07);

      gain.gain.setValueAtTime(level === 1 ? 0.18 : 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  // Realistic crystalline glass shatter sound
  playGlassShatter() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Noise burst of shattered crystal fragments
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.065));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(4200, now);
      noiseFilter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 2. Crystalline resonant harmonics
      [2200, 3400, 4800, 6200].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + Math.random() * 150, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.25 + idx * 0.04);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2 + idx * 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.01);
        osc.stop(now + 0.35);
      });
    } catch {}
  }

  // Satisfying futuristic chime when a task transforms into a nested Sub-Block
  playBlockTransform() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880, 1108.73]; // A major 7th ascension

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === freqs.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.0);
      });
    } catch {}
  }

  // Ambient sound generator: 'rain', 'space', 'waves'
  startAmbient(type = 'rain') {
    try {
      this.stopAmbient();
      this.init();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink / Brown noise synthesis
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'space') {
          // Deep brown noise
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        } else if (type === 'rain') {
          // Pink noise filter
          lastOut = (lastOut + 0.08 * white) / 1.06;
          data[i] = lastOut * 1.8;
        } else {
          // Waves
          lastOut = (lastOut + 0.04 * white) / 1.04;
          data[i] = lastOut * 2.2;
        }
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter
      const filter = this.ctx.createBiquadFilter();
      if (type === 'space') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      } else if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      } else {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseSource.start();
      this.ambientSource = noiseSource;
      this.ambientGain = gain;
    } catch (e) {
      console.warn('Ambient sound could not start:', e);
    }
  }

  stopAmbient() {
    try {
      if (this.ambientSource) {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
    } catch {
      // Ignore
    }
  }

  // Soothing, calm ambient chord soundscape with gentle ocean/rain texture
  playSoothingCalmMusic() {
    try {
      this.init();
      if (!this.ctx) return () => {};

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      // Gentle fade-in over 1.8 seconds to slight, comfortable volume
      masterGain.gain.linearRampToValueAtTime(0.24, now + 1.8);
      masterGain.connect(this.ctx.destination);

      // Harmonious warm major 9th chord (C - E - G - B - D + 528Hz healing Solfeggio)
      const frequencies = [130.81, 164.81, 196.00, 246.94, 293.66, 528.00];
      const oscillators = [];

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx - 2.5) * 4, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(360 + idx * 75, now);

        const voiceGain = (0.09 / frequencies.length) * (idx === frequencies.length - 1 ? 0.6 : 1);
        gain.gain.setValueAtTime(voiceGain, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        oscillators.push(osc);
      });

      // Subtle breathing ocean/rain texture in background
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastVal = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = (lastVal + 0.03 * white) / 1.03;
        data[i] = lastVal * 1.5;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(340, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.045, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);

      // Return cleanup function with smooth fade-out over 1.6s
      return () => {
        try {
          if (!this.ctx) return;
          const stopNow = this.ctx.currentTime;
          masterGain.gain.cancelScheduledValues(stopNow);
          masterGain.gain.setValueAtTime(masterGain.gain.value, stopNow);
          masterGain.gain.linearRampToValueAtTime(0.0001, stopNow + 1.6);

          setTimeout(() => {
            try {
              oscillators.forEach(o => {
                o.stop();
                o.disconnect();
              });
              noiseSource.stop();
              noiseSource.disconnect();
              masterGain.disconnect();
            } catch {}
          }, 1700);
        } catch {}
      };
    } catch (e) {
      console.warn('Soothing music failed to start:', e);
      return () => {};
    }
  }
}

export const sound = new SoundController();
