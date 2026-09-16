/**
 * All sound is synthesised at runtime with WebAudio — no recorded audio assets.
 * Ambience beds are layered noise/hum per area; SFX are short envelopes.
 */
import type { AmbienceId } from '../game/types';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambBus: GainNode | null = null;
let volume = 0.7;
let current: { id: AmbienceId; stop: () => void } | null = null;
let noiseBuf: AudioBuffer | null = null;

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    ambBus = ctx.createGain();
    ambBus.gain.value = 1;
    ambBus.connect(master);
    // 4 s of brown-ish noise, looped
    const len = ctx.sampleRate * 4;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.04 * w) / 1.04;
      d[i] = last * 3.2 + w * 0.08;
    }
    if (pendingAmb) setAmbience(pendingAmb);
  } catch { ctx = null; }
}

export function setVolume(v: number) {
  volume = v;
  if (master && ctx) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}

function noise(): AudioBufferSourceNode {
  const src = ctx!.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  return src;
}

function filt(type: BiquadFilterType, f: number, q = 0.7) {
  const b = ctx!.createBiquadFilter();
  b.type = type; b.frequency.value = f; b.Q.value = q;
  return b;
}

let pendingAmb: AmbienceId | null = null;

export function setAmbience(id: AmbienceId) {
  pendingAmb = id;
  if (!ctx || !ambBus) return;
  if (current?.id === id) return;
  current?.stop();
  if (id === 'none') { current = null; return; }
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ambBus);
  const nodes: AudioScheduledSourceNode[] = [];
  const timers: number[] = [];
  const t = ctx.currentTime;

  const bed = (type: BiquadFilterType, f: number, g: number, q = 0.7) => {
    const n = noise(); const fl = filt(type, f, q); const gg = ctx!.createGain();
    gg.gain.value = g; n.connect(fl).connect(gg).connect(out); n.start(); nodes.push(n);
    return gg;
  };
  const hum = (f: number, g: number, type: OscillatorType = 'sine') => {
    const o = ctx!.createOscillator(); const gg = ctx!.createGain();
    o.type = type; o.frequency.value = f; gg.gain.value = g;
    o.connect(gg).connect(out); o.start(); nodes.push(o);
  };
  const every = (min: number, max: number, fn: () => void) => {
    const loop = () => { fn(); timers.push(window.setTimeout(loop, min + Math.random() * (max - min))); };
    timers.push(window.setTimeout(loop, min * 0.5 + Math.random() * min));
  };

  switch (id) {
    case 'hall': // big room, air handling
      bed('lowpass', 160, 0.55); bed('bandpass', 420, 0.05, 0.5); hum(50, 0.012);
      every(9000, 20000, () => distantClank(out, 0.05));
      break;
    case 'stage': // equipment fans
      bed('lowpass', 200, 0.35); bed('bandpass', 1100, 0.06, 1.2); hum(120, 0.008); hum(240, 0.003, 'triangle');
      every(12000, 25000, () => distantClank(out, 0.04));
      break;
    case 'lobby': // wide reverberant space
      bed('lowpass', 260, 0.3); bed('highpass', 3000, 0.012);
      every(7000, 16000, () => glassTick(out));
      break;
    case 'backstage':
      bed('lowpass', 220, 0.45); hum(60, 0.01);
      every(5000, 12000, () => distantClank(out, 0.09));
      break;
    case 'dock':
      bed('lowpass', 300, 0.6); hum(38, 0.03, 'sawtooth');
      every(4000, 9000, () => distantClank(out, 0.12));
      break;
    case 'outside': {
      const g = bed('bandpass', 500, 0.25, 0.4);
      const lfo = ctx.createOscillator(); const lg = ctx.createGain();
      lfo.frequency.value = 0.07; lg.gain.value = 0.12; lfo.connect(lg).connect(g.gain); lfo.start(); nodes.push(lfo);
      bed('lowpass', 120, 0.3);
      break;
    }
  }
  out.gain.setTargetAtTime(1, t, 0.8);
  current = {
    id,
    stop: () => {
      const now = ctx!.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setTargetAtTime(0, now, 0.5);
      timers.forEach((x) => window.clearTimeout(x));
      window.setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch { /* */ } }); out.disconnect(); }, 2500);
    },
  };
}

function distantClank(out: AudioNode, g: number) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const n = noise(); const bp = filt('bandpass', 300 + Math.random() * 500, 6); const lp = filt('lowpass', 900);
  const gg = ctx.createGain(); gg.gain.setValueAtTime(0, t);
  gg.gain.linearRampToValueAtTime(g, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
  n.connect(bp).connect(lp).connect(gg).connect(out); n.start(t); n.stop(t + 1.8);
}

function glassTick(out: AudioNode) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); const gg = ctx.createGain();
  o.frequency.value = 2400 + Math.random() * 1600;
  gg.gain.setValueAtTime(0.006, t); gg.gain.exponentialRampToValueAtTime(0.00001, t + 2.2);
  o.connect(gg).connect(out); o.start(t); o.stop(t + 2.3);
}

type Sfx =
  | 'step' | 'look' | 'pickup' | 'click' | 'relay' | 'lock' | 'unlock' | 'error' | 'power'
  | 'shutter' | 'motor' | 'chime' | 'door' | 'breaker' | 'trip' | 'glow' | 'pa' | 'paper' | 'beep';

export function sfx(name: Sfx) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const env = (g: number, a: number, d: number, at = t) => {
    const gg = ctx!.createGain();
    gg.gain.setValueAtTime(0.0001, at);
    gg.gain.exponentialRampToValueAtTime(g, at + a);
    gg.gain.exponentialRampToValueAtTime(0.0001, at + a + d);
    gg.connect(master!);
    return gg;
  };
  const tone = (f: number, g: number, a: number, d: number, type: OscillatorType = 'sine', at = t) => {
    const o = ctx!.createOscillator(); o.type = type; o.frequency.value = f;
    o.connect(env(g, a, d, at)); o.start(at); o.stop(at + a + d + 0.05);
    return o;
  };
  const burst = (f: number, q: number, g: number, d: number, at = t, type: BiquadFilterType = 'bandpass') => {
    const n = noise(); const fl = filt(type, f, q);
    n.connect(fl).connect(env(g, 0.003, d, at)); n.start(at); n.stop(at + d + 0.05);
  };
  switch (name) {
    case 'step': burst(180, 1, 0.08, 0.12); burst(160, 1, 0.06, 0.12, t + 0.28); break;
    case 'look': burst(2500, 0.6, 0.02, 0.12, t, 'highpass'); break;
    case 'paper': burst(3500, 0.5, 0.05, 0.25, t, 'highpass'); break;
    case 'pickup': burst(1200, 2, 0.1, 0.08); tone(660, 0.04, 0.005, 0.15); break;
    case 'click': burst(4000, 3, 0.12, 0.03); break;
    case 'beep': tone(1320, 0.05, 0.005, 0.08, 'square'); break;
    case 'relay': burst(2500, 4, 0.25, 0.02); burst(1800, 4, 0.18, 0.02, t + 0.07); break;
    case 'lock': burst(900, 3, 0.3, 0.06); burst(400, 2, 0.2, 0.15, t + 0.04); break;
    case 'unlock': burst(1400, 5, 0.3, 0.03); burst(600, 3, 0.35, 0.2, t + 0.12); tone(180, 0.1, 0.005, 0.25, 'triangle', t + 0.12); break;
    case 'error': tone(220, 0.07, 0.01, 0.18, 'square'); tone(196, 0.07, 0.01, 0.25, 'square', t + 0.2); break;
    case 'breaker': burst(300, 1.5, 0.5, 0.12); tone(90, 0.2, 0.005, 0.2, 'triangle'); break;
    case 'trip': burst(300, 1.5, 0.5, 0.12); burst(200, 1, 0.3, 0.4, t + 0.1); tone(60, 0.15, 0.01, 0.8, 'sawtooth', t + 0.05); break;
    case 'power': {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(30, t); o.frequency.exponentialRampToValueAtTime(100, t + 1.8);
      const lp = filt('lowpass', 400); o.connect(lp).connect(env(0.12, 0.6, 2.2)); o.start(t); o.stop(t + 3);
      burst(2500, 4, 0.2, 0.02, t + 0.1); break;
    }
    case 'motor': {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
      const lp = filt('lowpass', 300); o.connect(lp).connect(env(0.14, 0.3, 3.2)); o.start(t); o.stop(t + 3.6);
      for (let i = 0; i < 10; i++) burst(700, 3, 0.05, 0.05, t + 0.2 + i * 0.3);
      burst(200, 1, 0.3, 0.3, t + 3.4); break;
    }
    case 'shutter': burst(5000, 1, 0.2, 0.04); burst(3000, 1, 0.15, 0.05, t + 0.09); break;
    case 'chime': tone(1046, 0.05, 0.01, 1.4); tone(1568, 0.035, 0.01, 1.6, 'sine', t + 0.12); break;
    case 'door': burst(250, 1, 0.3, 0.5); burst(1200, 3, 0.1, 0.06, t + 0.45); break;
    case 'glow': [880, 1175, 1480, 1760].forEach((f, i) => tone(f, 0.02, 0.2, 1.8, 'sine', t + i * 0.18)); break;
    case 'pa': [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.05, 0.01, 1.0, 'triangle', t + i * 0.32)); break;
  }
}

/** Short original motif for the ending (not based on any existing song). */
export function playEndingMotif() {
  if (!ctx || !master) return;
  const notes = [
    [0, 64], [0.5, 67], [1, 71], [1.5, 72], [2.5, 71], [3, 67], [4, 69], [4.5, 72], [5, 76], [6, 74],
    [7, 72], [7.5, 71], [8, 67], [9.5, 64],
  ];
  const t0 = ctx.currentTime + 0.3;
  const bus = ctx.createGain(); bus.gain.value = 0.5;
  const dl = ctx.createDelay(1); dl.delayTime.value = 0.42; const fb = ctx.createGain(); fb.gain.value = 0.35;
  bus.connect(master); bus.connect(dl); dl.connect(fb).connect(dl); dl.connect(master);
  for (const [at, midi] of notes) {
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    [1, 2, 3].forEach((h, i) => {
      const o = ctx!.createOscillator(); o.frequency.value = f * h; o.type = 'sine';
      const g = ctx!.createGain(); const st = t0 + at * 0.9;
      g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.06 / (i * 2 + 1), st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 2.6 / h);
      o.connect(g).connect(bus); o.start(st); o.stop(st + 2.8);
    });
  }
}
