// Web Audio API synthesized sound generator without external audio files

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play authentic camera shutter sound
 */
export function playShutterSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Blade snap (click 1)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const filter1 = ctx.createBiquadFilter();

  filter1.type = 'highpass';
  filter1.frequency.setValueAtTime(1000, now);

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(3200, now);
  osc1.frequency.exponentialRampToValueAtTime(120, now + 0.04);

  gain1.gain.setValueAtTime(0.7, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc1.connect(filter1);
  filter1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.05);

  // Mechanical curtain release (click 2)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1400, now + 0.06);
  osc2.frequency.exponentialRampToValueAtTime(80, now + 0.12);

  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(0.5, now + 0.06);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now + 0.06);
  osc2.stop(now + 0.13);
}

/**
 * Play timer countdown audio tick
 */
export function playCountdownBeep(enabled: boolean, isFinal = false): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const freq = isFinal ? 1760 : 880;
  const duration = isFinal ? 0.22 : 0.09;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

/**
 * Video recording start tone
 */
export function playRecordStartSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Video recording stop tone
 */
export function playRecordStopSound(enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.14);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.17);
}

/**
 * Trigger Android haptic vibration feedback
 */
export function triggerHaptic(enabled: boolean, pattern: number | number[] = 18): void {
  if (!enabled) return;
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptic may fail on some desktop browsers or if blocked
    }
  }
}
