/* Simple WebAudio ASMR-style feedback — generated (no external files) */
class ClickSounds {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }
  async ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    this.enabled = true;
  }
  toggle(on) {
    this.enabled = on;
    if (!on && this.ctx && this.ctx.state !== 'closed') {
      // keep context for later; no-op
    }
  }
  /* soft tick on press */
  press() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.09);
  }
  /* start whoosh */
  start() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(440, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.32);
  }
  /* milestone ping every 10 presses */
  ping() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(this.ctx.destination);
    o.start(t); o.stop(t + 0.14);
  }
  /* final chime */
  finish() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o1.type = 'sine'; o2.type = 'sine';
    o1.frequency.setValueAtTime(523.25, t); // C5
    o2.frequency.setValueAtTime(659.25, t); // E5
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o1.connect(g); o2.connect(g); g.connect(this.ctx.destination);
    o1.start(t); o2.start(t);
    o1.stop(t + 0.65); o2.stop(t + 0.65);
  }
}

window.ClickSounds = ClickSounds;
