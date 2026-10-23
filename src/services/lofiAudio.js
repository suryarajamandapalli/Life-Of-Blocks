// Lo-Fi Audio Engine for LIFE OF BLOCKS
// Provides smooth, zero-latency ambient chords, healing frequencies, and vinyl texture
// Works 100% offline, on web, mobile browser, and native Android APK.

export const LOFI_PLAYLIST = [
  {
    id: 'snowfall',
    title: 'Snowfall',
    artist: 'Øneheart & reidenshi',
    duration: 124, // 02:04
    artwork: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=360&auto=format&fit=crop&q=80',
    spotifyUrl: 'https://open.spotify.com/track/4jVqCgZl2G3Gk5lA6o2bQf',
    baseFreqs: [130.81, 155.56, 196.00, 233.08, 528.00],
    mood: 'Ambient Chill'
  },
  {
    id: 'hope-to-see-you',
    title: 'Hope to See You Again',
    artist: 'Antent',
    duration: 147, // 02:27
    artwork: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=360&auto=format&fit=crop&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/5LaauJZw8vn2gPWHxDFYc2',
    baseFreqs: [138.59, 174.61, 207.65, 261.63, 432.00],
    mood: 'Warm Lo-Fi'
  },
  {
    id: 'constellation',
    title: 'Constellation',
    artist: 'LOW5',
    duration: 96, // 01:36
    artwork: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=360&auto=format&fit=crop&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/5LaauJZw8vn2gPWHxDFYc2',
    baseFreqs: [116.54, 146.83, 174.61, 220.00, 528.00],
    mood: 'Deep Space'
  },
  {
    id: 'watching-stars',
    title: 'Watching the Stars',
    artist: 'Øneheart',
    duration: 135, // 02:15
    artwork: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=360&auto=format&fit=crop&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/5LaauJZw8vn2gPWHxDFYc2',
    baseFreqs: [123.47, 155.56, 185.00, 246.94, 396.00],
    mood: 'Ethereal Sky'
  },
  {
    id: 'midnight-solitude',
    title: 'Midnight Solitude',
    artist: 'Life of Blocks Lo-Fi',
    duration: 152, // 02:32
    artwork: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=360&auto=format&fit=crop&q=80',
    spotifyUrl: 'https://open.spotify.com/playlist/5LaauJZw8vn2gPWHxDFYc2',
    baseFreqs: [130.81, 164.81, 196.00, 246.94, 528.00],
    mood: 'Rain / Study Focus'
  }
];

class LofiAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeNodes = [];
    this.noiseNode = null;
    this.isPlaying = false;
    this.currentTrackIndex = 0;
    this.currentTime = 0;
    this.volume = 0.75;
    this.listeners = new Set();
    this.tickInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume * 0.22, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('AudioContext init notice:', e);
    }
  }

  getCurrentTrack() {
    return LOFI_PLAYLIST[this.currentTrackIndex] || LOFI_PLAYLIST[0];
  }

  getState() {
    const track = this.getCurrentTrack();
    return {
      isPlaying: this.isPlaying,
      currentTrackIndex: this.currentTrackIndex,
      currentTrack: track,
      currentTime: this.currentTime,
      duration: track.duration,
      progressPercent: Math.min(100, Math.max(0, (this.currentTime / track.duration) * 100)),
      volume: this.volume
    };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try { fn(state); } catch {}
    });
  }

  play() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startSynthesizer();
      this.startTimer();
      this.notify();
    }
  }

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.stopSynthesizer();
      this.stopTimer();
      this.notify();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  next() {
    const wasPlaying = this.isPlaying;
    this.stopSynthesizer();
    this.currentTrackIndex = (this.currentTrackIndex + 1) % LOFI_PLAYLIST.length;
    this.currentTime = 0;
    if (wasPlaying) {
      this.startSynthesizer();
    }
    this.notify();
  }

  prev() {
    const wasPlaying = this.isPlaying;
    this.stopSynthesizer();
    if (this.currentTime > 3) {
      this.currentTime = 0;
    } else {
      this.currentTrackIndex = (this.currentTrackIndex - 1 + LOFI_PLAYLIST.length) % LOFI_PLAYLIST.length;
      this.currentTime = 0;
    }
    if (wasPlaying) {
      this.startSynthesizer();
    }
    this.notify();
  }

  selectTrack(index) {
    if (index >= 0 && index < LOFI_PLAYLIST.length) {
      const wasPlaying = this.isPlaying;
      this.stopSynthesizer();
      this.currentTrackIndex = index;
      this.currentTime = 0;
      if (wasPlaying) {
        this.startSynthesizer();
      }
      this.notify();
    }
  }

  seek(seconds) {
    const track = this.getCurrentTrack();
    this.currentTime = Math.max(0, Math.min(seconds, track.duration));
    this.notify();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.22, this.ctx.currentTime);
    }
    this.notify();
  }

  startTimer() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.tickInterval = setInterval(() => {
      const track = this.getCurrentTrack();
      this.currentTime += 0.5;
      if (this.currentTime >= track.duration) {
        this.next();
      } else {
        this.notify();
      }
    }, 500);
  }

  stopTimer() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  startSynthesizer() {
    if (!this.ctx || !this.masterGain) return;
    this.stopSynthesizer();

    const track = this.getCurrentTrack();
    const now = this.ctx.currentTime;
    const freqs = track.baseFreqs || [130.81, 164.81, 196.00, 246.94, 528.00];

    // Smooth fade in
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume * 0.22, now + 1.2);

    // Warm ambient chords
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Slight detune for warm analog chorus effect
      osc.detune.setValueAtTime((idx - 2) * 5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320 + idx * 80, now);

      const voiceVolume = (0.08 / freqs.length) * (idx === freqs.length - 1 ? 0.6 : 1);
      gain.gain.setValueAtTime(voiceVolume, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      this.activeNodes.push(osc, gain, filter);
    });

    // Gentle vinyl / ocean sound texture
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastVal = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = (lastVal + 0.025 * white) / 1.025;
        data[i] = lastVal * 1.2;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(320, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.035, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.start(now);
      this.noiseNode = noiseSource;
    } catch {}
  }

  stopSynthesizer() {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.5);

      const nodesToClean = [...this.activeNodes];
      const noiseToClean = this.noiseNode;
      this.activeNodes = [];
      this.noiseNode = null;

      setTimeout(() => {
        try {
          nodesToClean.forEach(node => {
            if (typeof node.stop === 'function') node.stop();
            if (typeof node.disconnect === 'function') node.disconnect();
          });
          if (noiseToClean) {
            noiseToClean.stop();
            noiseToClean.disconnect();
          }
        } catch {}
      }, 550);
    } catch {}
  }
}

export const lofiAudio = new LofiAudioEngine();

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
