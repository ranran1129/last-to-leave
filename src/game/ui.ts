import { useSyncExternalStore } from 'react';

/** Transient UI state — not saved. */
export interface UIState {
  closeup: string | null;
  closeupFromPhoto: boolean;
  caption: string | null;
  captionKey: number;
  phoneOpen: boolean;
  phoneTab: 'camera' | 'photos' | 'memo' | 'hints' | 'settings';
  photoView: string | null;
  flash: number;
  toast: string | null;
  cinematic: string | null;
  inspectItem: string | null;
}

let ui: UIState = {
  closeup: null, closeupFromPhoto: false, caption: null, captionKey: 0,
  phoneOpen: false, phoneTab: 'memo', photoView: null, flash: 0, toast: null,
  cinematic: null, inspectItem: null,
};
const ls = new Set<() => void>();
export const getUI = () => ui;
export function setUI(p: Partial<UIState> | ((u: UIState) => Partial<UIState>)) {
  ui = { ...ui, ...(typeof p === 'function' ? p(ui) : p) };
  ls.forEach((l) => l());
}
export function useUI<T>(sel: (u: UIState) => T): T {
  return useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l); }, () => sel(ui));
}

let capTimer: number | undefined;
export function say(text: string, ms = 0) {
  window.clearTimeout(capTimer);
  setUI((u) => ({ caption: text, captionKey: u.captionKey + 1 }));
  const dur = ms || Math.min(9000, 2600 + text.length * 70);
  capTimer = window.setTimeout(() => setUI({ caption: null }), dur);
}

let toastTimer: number | undefined;
export function toast(text: string) {
  window.clearTimeout(toastTimer);
  setUI({ toast: text });
  toastTimer = window.setTimeout(() => setUI({ toast: null }), 2600);
}
