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
}

export const sound = new SoundController();
