class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playFile(src: string) {
    if (!this.enabled) return;
    let audio = this.audioCache.get(src);
    if (!audio) {
      audio = new Audio(src);
      this.audioCache.set(src, audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  preload() {
    const files = ['/sounds/big-win.mp3', '/sounds/mega-win.mp3', '/sounds/streak.mp3', '/sounds/red-card.mp3', '/sounds/goal-rush.mp3'];
    files.forEach(src => {
      const a = new Audio(src);
      a.preload = 'auto';
      this.audioCache.set(src, a);
    });
  }

  toggle(on?: boolean) {
    this.enabled = on ?? !this.enabled;
  }

  /**
   * Short blip when ball hits a pin. Pitch varies slightly.
   */
  playPinHit() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 600 + Math.random() * 400; // 600-1000 Hz
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * Win sound — ascending tone.
   */
  playWin(multiplier: number) {
    if (!this.enabled) return;
    const ctx = this.getContext();

    if (multiplier >= 10) {
      this.playMegaWin();
      return;
    }
    if (multiplier >= 5) {
      this.playBigWin();
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = multiplier >= 2 ? 523 : 440;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * Loss sound — descending tone.
   */
  playLoss() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  playBigWin() { this.playFile('/sounds/big-win.mp3'); }
  playMegaWin() { this.playFile('/sounds/mega-win.mp3'); }
  playStreakSound() { this.playFile('/sounds/streak.mp3'); }
  playRedCard() { this.playFile('/sounds/red-card.mp3'); }
  playGoalRush() { this.playFile('/sounds/goal-rush.mp3'); }
}

export const soundManager = new SoundManager();
