import { getState, setState, initialState, loadSave, clearSave, replaceState, flushSave } from './store';
import type { GameState, ItemId, PuzzleId, SceneId, PenColor } from './types';
import { MEMOS } from './memos';
import { say, setUI, toast, getUI } from './ui';
import { sfx } from '../audio/audio';
import { puzzleById } from './puzzles';

const BASE_CLOCK_MIN = 23 * 60 + 47; // 23:47 when the game starts

export function clockText(s: GameState = getState()) {
  const m = BASE_CLOCK_MIN + Math.floor(s.playMs / 60000 / 1.5);
  const h = Math.floor(m / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function addMemo(s: GameState, key: string): GameState {
  if (!MEMOS[key] || s.memos.includes(key)) return s;
  return { ...s, memos: [...s.memos, key] };
}

export function newGame() {
  clearSave();
  replaceState({ ...initialState(), phase: 'intro' });
  setUI({ closeup: null, phoneOpen: false, caption: null, inspectItem: null, cinematic: null });
}

export function continueGame() {
  const s = loadSave();
  if (!s) return newGame();
  replaceState({ ...s, phase: s.phase === 'title' ? 'play' : s.phase });
}

export function resetGame() {
  clearSave();
  replaceState(initialState());
  setUI({ closeup: null, phoneOpen: false, caption: null, inspectItem: null, cinematic: null });
}

export function startPlay() {
  setState((s) => ({ ...s, phase: 'play' }));
  flushSave();
}

export function tick(ms: number) {
  const s = getState();
  if (s.phase !== 'play') return;
  setState((x) => ({ ...x, playMs: x.playMs + ms }));
}

export function go(id: SceneId) {
  sfx('step');
  setState((s) => ({ ...s, prevScene: s.scene, scene: id, heldItem: null }));
  setUI({ caption: null });
}

export function setFlag(flag: string) {
  setState((s) => (s.flags[flag] ? s : addMemo({ ...s, flags: { ...s.flags, [flag]: true } }, `m:${flag}`)));
}

export function openCloseup(id: string) {
  setFlag(`seen:${id}`);
  setState((s) => addMemo(s, `m:${id}`));
  setUI({ closeup: id, closeupFromPhoto: false, caption: null });
  sfx('look');
}

export function closeCloseup() {
  setUI({ closeup: null, closeupFromPhoto: false });
}

export function takeItem(item: ItemId, flag?: string) {
  setState((s) => {
    if (s.items.includes(item)) return s;
    let n = { ...s, items: [...s.items, item] };
    if (flag) n = { ...n, flags: { ...n.flags, [flag]: true } };
    return n;
  });
  sfx('pickup');
}

export function removeItem(item: ItemId) {
  setState((s) => ({ ...s, items: s.items.filter((i) => i !== item), heldItem: s.heldItem === item ? null : s.heldItem }));
}

export function holdItem(item: ItemId | null) {
  setState((s) => ({ ...s, heldItem: s.heldItem === item ? null : item }));
}

export function setPenColor(c: PenColor) {
  setState((s) => ({ ...s, penColor: c }));
  sfx('click');
}

export function setScratch(key: string, value: unknown) {
  setState((s) => ({ ...s, scratch: { ...s.scratch, [key]: value } }));
}

export function solve(id: PuzzleId, message?: string) {
  const s = getState();
  if (s.solved[id]) return;
  setState((x) => addMemo({ ...x, solved: { ...x.solved, [id]: true } }, `m:${id}`));
  flushSave();
  if (message) window.setTimeout(() => say(message), 900);
}

export function findSecret(id: string, text: string) {
  const s = getState();
  say(text);
  if (s.secrets.includes(id)) return;
  setState((x) => ({ ...x, secrets: [...x.secrets, id] }));
  sfx('chime');
}

export function useHint(id: PuzzleId) {
  setState((s) => ({ ...s, hints: { ...s.hints, [id]: Math.min(3, (s.hints[id] ?? 0) + 1) } }));
  sfx('click');
}

export function viewAnswer(id: PuzzleId) {
  setState((s) => ({ ...s, answers: { ...s.answers, [id]: true } }));
}

export function takePhoto(subject: string, label: string) {
  const s = getState();
  if (s.photos.some((p) => p.subject === subject)) {
    toast('この写真はもう撮ってある');
    sfx('shutter');
    setUI((u) => ({ flash: u.flash + 1 }));
    return;
  }
  setState((x) => ({
    ...x,
    photos: [...x.photos, { id: `ph${x.photos.length + 1}`, subject, label, at: clockText(x) }],
  }));
  sfx('shutter');
  setUI((u) => ({ flash: u.flash + 1 }));
  toast('写真に保存した');
}

export function describePuzzle(id: PuzzleId) {
  return puzzleById(id).name;
}

export function isCloseupOpen() { return !!getUI().closeup; }
