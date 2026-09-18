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
    if (pendingMusic) setMusic(pendingMusic);
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
  // 前のベッドが残って重なると「ジー」と鳴り続けるので、必ず止めてから張り替える
  current?.stop();
  current = null;
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

  // 空調や機材の「気配」程度に留める（前は砂嵐のように聞こえていた）
  switch (id) {
    case 'hall': // 広い空間の空調
      bed('lowpass', 120, 0.16); hum(50, 0.008);
      every(9000, 20000, () => distantClank(out, 0.04));
      break;
    case 'stage': // 機材のファン
      bed('lowpass', 150, 0.1); bed('bandpass', 700, 0.012, 1.2); hum(120, 0.006); hum(240, 0.002, 'triangle');
      every(12000, 25000, () => distantClank(out, 0.03));
      break;
    case 'lobby': // 広く響く空間
      bed('lowpass', 180, 0.09);
      every(7000, 16000, () => glassTick(out));
      break;
    case 'backstage':
      bed('lowpass', 160, 0.12); hum(60, 0.007);
      every(5000, 12000, () => distantClank(out, 0.07));
      break;
    case 'dock':
      // うなり（サワトゥース）は耳障りなので使わない
      bed('lowpass', 150, 0.1); hum(46, 0.006);
      every(4000, 9000, () => distantClank(out, 0.07));
      break;
    case 'outside': {
      const g = bed('bandpass', 340, 0.05, 0.4);
      const lfo = ctx.createOscillator(); const lg = ctx.createGain();
      lfo.frequency.value = 0.05; lg.gain.value = 0.025; lfo.connect(lg).connect(g.gain); lfo.start(); nodes.push(lfo);
      bed('lowpass', 100, 0.07);
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

// =====================================================================  BGM
/**
 * オリジナルのアンビエントBGM（すべてWebAudioで合成。外部音源は使わない）。
 * ゆっくり動くパッド＋まばらなピアノ風の音を、リバーブとディレイに通して鳴らす。
 */
let music: { stop: () => void; id: MusicId } | null = null;
export type MusicId = 'hall' | 'backstage' | 'ending' | 'title' | 'none';
let musicVol = 0.55;
let musicOn = true;
let pendingMusic: MusicId | null = null;

/** 4小節ぶんのコード進行（根音のMIDI番号と構成音） */
const PROGRESSIONS: Record<Exclude<MusicId, 'none'>, number[][]> = {
  // Am9 → Fmaj7 → Cmaj7 → G6（静かで、少し切ない響き）
  hall: [[57, 60, 64, 67, 71], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 67]],
  // 低めに、動きを少なく
  backstage: [[45, 52, 57, 60], [43, 50, 55, 59], [41, 48, 53, 57], [43, 50, 55, 62]],
  // 解放感のある終曲
  ending: [[53, 60, 65, 69], [48, 55, 60, 64], [50, 57, 62, 65], [55, 59, 64, 67]],
  title: [[45, 52, 57, 64], [50, 57, 60, 64], [43, 50, 55, 62], [48, 55, 59, 64]],
};
const PENTA = [0, 2, 4, 7, 9];

function makeReverb(seconds = 3.2, decay = 2.6): ConvolverNode {
  const rate = ctx!.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx!.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const conv = ctx!.createConvolver();
  conv.buffer = buf;
  return conv;
}

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export function setMusicVolume(v: number) { musicVol = v; }
export function setMusicEnabled(on: boolean) {
  musicOn = on;
  if (!on) { music?.stop(); music = null; }
  else if (pendingMusic) setMusic(pendingMusic);
}

export function setMusic(id: MusicId) {
  pendingMusic = id;
  if (!ctx || !master) return;
  if (!musicOn || id === 'none') { music?.stop(); music = null; return; }
  if (music?.id === id) return;
  music?.stop();

  const out = ctx.createGain();
  out.gain.value = 0;
  const rev = makeReverb();
  const wet = ctx.createGain(); wet.gain.value = 0.55;
  const dly = ctx.createDelay(1.2); dly.delayTime.value = 0.56;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  out.connect(master); out.connect(rev).connect(wet).connect(master);
  out.connect(dly); dly.connect(fb).connect(dly); dly.connect(wet);

  const nodes: AudioScheduledSourceNode[] = [];
  const timers: number[] = [];
  const prog = PROGRESSIONS[id];
  let bar = 0;

  const pad = (midi: number, at: number, dur: number, gain: number) => {
    const o = ctx!.createOscillator(); const g = ctx!.createGain(); const f = filt('lowpass', 900, 0.8);
    o.type = 'triangle';
    o.frequency.value = mtof(midi) * (1 + (Math.random() - 0.5) * 0.004);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f).connect(g).connect(out);
    o.start(at); o.stop(at + dur + 0.2);
    nodes.push(o);
  };
  const note = (midi: number, at: number, gain = 0.05) => {
    [1, 2, 3.01].forEach((h, i) => {
      const o = ctx!.createOscillator(); const g = ctx!.createGain();
      o.type = 'sine'; o.frequency.value = mtof(midi) * h;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain / (i * 2.2 + 1), at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 2.8 / h);
      o.connect(g).connect(out);
      o.start(at); o.stop(at + 3.2);
      nodes.push(o);
    });
  };

  const BAR = id === 'ending' ? 7 : 9; // 1コードの長さ（秒）
  const playBar = () => {
    if (!ctx) return;
    const at = ctx.currentTime + 0.05;
    const chord = prog[bar % prog.length];
    chord.forEach((m, i) => pad(m - (i === 0 ? 12 : 0), at, BAR + 1.6, 0.028 - i * 0.003));
    // まばらなメロディ（コードの構成音＋ペンタトニック）
    const root = chord[0];
    const count = id === 'backstage' ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const t = at + 0.6 + Math.random() * (BAR - 1.5);
      const deg = PENTA[Math.floor(Math.random() * PENTA.length)];
      note(root + 12 + deg, t, 0.045);
      if (Math.random() < 0.35) note(root + 24 + deg, t + 0.42, 0.022);
    }
    bar++;
    timers.push(window.setTimeout(playBar, BAR * 1000));
  };
  playBar();
  out.gain.setTargetAtTime(musicVol * (id === 'ending' ? 0.9 : 0.6), ctx.currentTime, 2.5);

  music = {
    id,
    stop: () => {
      const now = ctx!.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setTargetAtTime(0, now, 1.2);
      timers.forEach((t) => window.clearTimeout(t));
      window.setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch { /* */ } }); out.disconnect(); }, 5000);
    },
  };
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
