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

  // Movie-quality acoustic glass stress crack sound for block breaking interaction
  playGlassCrack(level = 1) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Physical strike impact thud (low-mid transient knock)
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(level === 1 ? 240 : 190, now);
      thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.05);
      thudGain.gain.setValueAtTime(level === 1 ? 0.35 : 0.45, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.06);

      // 2. High-pressure acoustic glass fissure snap (shaped high-frequency crackle)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(level === 1 ? 4000 : 3000, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(level === 1 ? 0.4 : 0.55, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 3. Inharmonic crystalline glass modal rings
      const modalFreqs = level === 1 
        ? [3800, 5600, 8400] 
        : [2900, 4600, 6800, 9200];

      modalFreqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 80, now);

        gain.gain.setValueAtTime(0.08 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06 + idx * 0.02);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      });

      // For Level 2: add a secondary micro-fracture snap 18ms later (crack propagating across panel)
      if (level >= 2) {
        const snapDelay = 0.018;
        const snapOsc = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snapOsc.type = 'sawtooth';
        snapOsc.frequency.setValueAtTime(6200, now + snapDelay);
        snapOsc.frequency.exponentialRampToValueAtTime(1800, now + snapDelay + 0.04);
        snapGain.gain.setValueAtTime(0.25, now + snapDelay);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + snapDelay + 0.04);
        snapOsc.connect(snapGain);
        snapGain.connect(this.ctx.destination);
        snapOsc.start(now + snapDelay);
        snapOsc.stop(now + snapDelay + 0.05);
      }
    } catch {}
  }

  // Hyper-realistic crystalline glass explosion & shatter sound with falling shard scatter
  playGlassShatter() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Deep Sub Impact Boom (the weight of the smash)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.22);
      subGain.gain.setValueAtTime(0.65, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.25);

      // 2. High-energy explosive fracture blast (wideband white/pink noise explosion)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / this.ctx.sampleRate;
        const env = Math.exp(-t / 0.06) * 0.8 + Math.exp(-t / 0.25) * 0.3;
        data[i] = (Math.random() * 2 - 1) * env;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(5400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
      noiseFilter.Q.setValueAtTime(1.8, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 3. Glass plate inharmonic modal resonances (violent fracture ring)
      [2150, 3280, 4720, 6350, 7890, 9600].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 120, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.55, now + 0.18 + idx * 0.03);

        gain.gain.setValueAtTime(0.16 / (idx * 0.4 + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22 + idx * 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.004);
        osc.stop(now + 0.35);
      });

      // 4. Cascading Shower of Falling & Tinkling Shards (The Realism Multiplier!)
      // 18 tiny crystalline pings randomly cascading as glass fragments bounce and disperse
      for (let s = 0; s < 18; s++) {
        const delay = 0.04 + Math.random() * 0.45;
        const shardFreq = 4000 + Math.random() * 5500;
        const shardDuration = 0.03 + Math.random() * 0.04;

        const shardOsc = this.ctx.createOscillator();
        const shardGain = this.ctx.createGain();
        shardOsc.type = 'sine';
        shardOsc.frequency.setValueAtTime(shardFreq, now + delay);

        const shardVol = 0.04 * (1 - delay / 0.55);
        shardGain.gain.setValueAtTime(0, now + delay);
        shardGain.gain.linearRampToValueAtTime(shardVol, now + delay + 0.003);
        shardGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + shardDuration);

        shardOsc.connect(shardGain);
        shardGain.connect(this.ctx.destination);
        shardOsc.start(now + delay);
        shardOsc.stop(now + delay + shardDuration + 0.01);
      }
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
