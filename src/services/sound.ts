// Web Audio API synthesized soothing Zen & Minecraft-inspired acoustic soundscapes
// Features: Warm wooden kalimba/marimba clicks with organic pitch variance,
// crystalline XP orb bell chimes, tactile wood block pops, and C418-style ambient chords.

class SoundService {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;
  private zenAmbienceTimer: any = null;
  private isZenAmbienceActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock AudioContext on first user interaction (browser autoplay policy)
      const unlockAudio = () => {
        this.initCtx();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.isZenAmbienceActive) {
      this.stopZenAmbience();
    }
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.playTap();
    }
    return this.enabled;
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Minecraft Wooden UI Click / Kalimba Tap
   * - Soft acoustic marimba mallet strike with authentic random pitch variance (+/- 5%)
   * - Rounded low-pass warm filter so it never sounds harsh or piercing.
   */
  public playTap(pitchMultiplier: number = 1.0) {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Minecraft's signature organic pitch variation
      const randomPitch = 0.95 + Math.random() * 0.1;
      const baseFreq = 520 * pitchMultiplier * randomPitch;

      // Primary acoustic body (warm sine)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      // Subtle wooden harmonic (second octave overtone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      // Warm low-pass filter to remove any digital click
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, now + 0.045);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.045, now + 0.002);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2.02, now);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.012, now + 0.002);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc1.connect(gain1);
      osc2.connect(gain2);

      gain1.connect(filter);
      gain2.connect(filter);

      filter.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.05);
      osc2.start(now);
      osc2.stop(now + 0.05);
    } catch (e) {}
  }

  /**
   * Minecraft XP Orb / Crystalline Zen Bell
   * - Pure crystalline ascending bell chime with physics-based bell overtone (2.756x ratio)
   * - Deeply rewarding and peaceful when a task is completed.
   */
  public playTaskComplete() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Two peaceful bell strikes in quick succession (like collecting XP orbs)
      const bells = [
        { freq: 880, delay: 0, gain: 0.05, duration: 0.55 },       // A5
        { freq: 1174.66, delay: 0.07, gain: 0.06, duration: 0.75 } // D6 (Peaceful fourth ascent)
      ];

      bells.forEach(bell => {
        const strikeTime = now + bell.delay;

        // Fundamental pure tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Crystalline bell overtone (chime shimmer)
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, strikeTime);
        filter.frequency.exponentialRampToValueAtTime(1200, strikeTime + bell.duration);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(bell.freq, strikeTime);

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(bell.freq * 2.756, strikeTime); // Natural bell overtone

        // Gentle attack, long serene tail
        gain.gain.setValueAtTime(0.001, strikeTime);
        gain.gain.linearRampToValueAtTime(bell.gain, strikeTime + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + bell.duration);

        chimeGain.gain.setValueAtTime(0.001, strikeTime);
        chimeGain.gain.linearRampToValueAtTime(bell.gain * 0.35, strikeTime + 0.003);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + bell.duration * 0.6);

        osc.connect(gain);
        chimeOsc.connect(chimeGain);

        gain.connect(filter);
        chimeGain.connect(filter);

        filter.connect(ctx.destination);

        osc.start(strikeTime);
        osc.stop(strikeTime + bell.duration);
        chimeOsc.start(strikeTime);
        chimeOsc.stop(strikeTime + bell.duration);
      });
    } catch (e) {}
  }

  /**
   * Minecraft Wood Block Place / Item Pop
   * - Used when: adding a task, dropping an app, creating a block.
   * - Satisfying hollow acoustic wood thump/pop.
   */
  public playWoodPop() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(2.8, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  /**
   * C418 Zen Sanctuary / Entering Block Workspace
   * - Warm D-major pentatonic ambient chord (Felt piano / Singing bowl)
   * - Evokes the peaceful wonder of C418's "Sweden" and "Subwoofer Lullaby".
   */
  public playEnterBlock() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      // D Major Zen Chord: D4 (293.66 Hz), A4 (440 Hz), F#5 (739.99 Hz)
      const chord = [
        { freq: 293.66, delay: 0.00, gain: 0.045 },
        { freq: 440.00, delay: 0.04, gain: 0.038 },
        { freq: 739.99, delay: 0.09, gain: 0.030 }
      ];

      chord.forEach(note => {
        const start = now + note.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warm felt low-pass filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, start);
        filter.frequency.exponentialRampToValueAtTime(450, start + 0.7);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(note.gain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.75);
      });
    } catch (e) {}
  }

  /**
   * Soft Bamboo Breath / Dismiss / Back
   * - Gentle descending acoustic note with filtered air envelope.
   */
  public playDismiss() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.12);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.11);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  /**
   * Theme Switch Acoustic Chime
   * - Light: Bright daylight crystal chime
   * - Dark: Deep warm Tibetan singing bowl resonance
   */
  public playTheme(theme: 'light' | 'dark') {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (theme === 'light') {
        // High crystalline sunrise bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now); // E6

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else {
        // Deep Tibetan singing bowl (174 Hz Solfeggio / D3)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(174.61, now); // F3 Solfeggio natural frequency

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.055, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.9);
      }
    } catch (e) {}
  }

  /**
   * Wallpaper Change Ethereal Chime
   * - Delicate celestial arpeggio (E5 -> A5 -> E6)
   */
  public playWallpaper() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [659.25, 880.00, 1318.51];

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.028 / (idx + 1), start + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.42);
      });
    } catch (e) {}
  }

  /**
   * App Drawer / Modal Fluid Opening Swoosh
   */
  public playOpen() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  /**
   * App Icon Drag Drop / Reorder Click
   */
  public playDrop() {
    this.playTap(0.85);
  }

  /**
   * Zen Ambience Music (Minecraft Peaceful Ambient Notes)
   * - Periodically plays gentle, tranquil pentatonic notes in the background.
   */
  public startZenAmbience() {
    if (this.isZenAmbienceActive) return;
    this.isZenAmbienceActive = true;

    const playRandomZenNote = () => {
      if (!this.enabled || !this.isZenAmbienceActive) return;
      try {
        const ctx = this.initCtx();
        if (ctx) {
          // C418 Zen Pentatonic Scale (D, E, G, A, B)
          const zenScale = [293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 783.99];
          const freq = zenScale[Math.floor(Math.random() * zenScale.length)];
          const now = ctx.currentTime;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.02, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.00001, now + 1.2);

          osc.connect(gain);
          gain.connect(filter);
          filter.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 1.3);
        }
      } catch (e) {}

      // Schedule next sparse tranquil note between 18 and 32 seconds
      const nextDelay = 18000 + Math.random() * 14000;
      this.zenAmbienceTimer = setTimeout(playRandomZenNote, nextDelay);
    };

    // First note starts after 5 seconds
    this.zenAmbienceTimer = setTimeout(playRandomZenNote, 5000);
  }

  public stopZenAmbience() {
    this.isZenAmbienceActive = false;
    if (this.zenAmbienceTimer) {
      clearTimeout(this.zenAmbienceTimer);
      this.zenAmbienceTimer = null;
    }
  }

  public isZenActive(): boolean {
    return this.isZenAmbienceActive;
  }
}

export const soundService = new SoundService();
