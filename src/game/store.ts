import { useSyncExternalStore } from 'react';
import type { GameState, Settings } from './types';

export const SAVE_KEY = 'ltl_save';
export const SETTINGS_KEY = 'ltl_settings';
export const SAVE_VERSION = 3;

export function initialState(): GameState {
  return {
    version: SAVE_VERSION,
    phase: 'title',
    scene: 'arena',
    prevScene: null,
    playMs: 0,
    flags: {},
    items: ['ticket', 'penlight'],
    heldItem: null,
    penColor: 'orange',
    solved: {},
    hints: {},
    answers: {},
    photos: [],
    memos: ['m:preshow'],
    secrets: [],
    scratch: {},
    cleared: false,
    clearMs: 0,
  };
}

/**
 * Migrate older saves. Unknown / newer versions are discarded instead of
 * crashing the game; field additions are filled from the initial state.
 */
export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<GameState>;
  if (typeof r.version !== 'number' || r.version > SAVE_VERSION) return null;
  const base = initialState();
  const merged: GameState = { ...base, ...r, version: SAVE_VERSION } as GameState;
  if (!Array.isArray(merged.items)) merged.items = base.items;
  if (!Array.isArray(merged.photos)) merged.photos = [];
  if (!Array.isArray(merged.memos)) merged.memos = base.memos;
  if (!Array.isArray(merged.secrets)) merged.secrets = [];
  merged.flags = merged.flags ?? {};
  merged.scratch = merged.scratch ?? {};
  return merged;
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, v: string) {
  try { localStorage.setItem(key, v); } catch { /* storage unavailable */ }
}
function safeDel(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function loadSave(): GameState | null {
  const txt = safeGet(SAVE_KEY);
  if (!txt) return null;
  try { return migrate(JSON.parse(txt)); } catch { return null; }
}

export function hasContinue(): boolean {
  const s = loadSave();
  return !!s && s.phase !== 'title' && !s.cleared;
}

let state: GameState = initialState();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

export function getState() { return state; }

export function setState(fn: (s: GameState) => GameState) {
  state = fn(state);
  listeners.forEach((l) => l());
  if (state.phase === 'play' || state.phase === 'ending') {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => safeSet(SAVE_KEY, JSON.stringify(state)), 150);
  }
}

export function flushSave() {
  window.clearTimeout(saveTimer);
  safeSet(SAVE_KEY, JSON.stringify(state));
}

export function replaceState(next: GameState) {
  state = next;
  listeners.forEach((l) => l());
}

export function clearSave() { safeDel(SAVE_KEY); }

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useGame<T>(sel: (s: GameState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state));
}

// ---- settings (separate from save data so RESET keeps them) ----
let settings: Settings = { volume: 0.7, musicVolume: 0.55, subtitles: true, reduceMotion: false, tapMarks: true };
try {
  const t = safeGet(SETTINGS_KEY);
  if (t) settings = { ...settings, ...JSON.parse(t) };
} catch { /* ignore */ }
const setListeners = new Set<() => void>();
export function getSettings() { return settings; }
export function setSettings(p: Partial<Settings>) {
  settings = { ...settings, ...p };
  safeSet(SETTINGS_KEY, JSON.stringify(settings));
  setListeners.forEach((l) => l());
}
export function useSettings() {
  return useSyncExternalStore((l) => { setListeners.add(l); return () => setListeners.delete(l); }, () => settings);
}
