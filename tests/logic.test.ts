import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PUZZLES, puzzleStatus, checkP1, checkP2, checkP3, checkP4, checkP5, checkP6, checkMeta } from '../src/game/puzzles';
import { initialState, migrate, SAVE_VERSION } from '../src/game/store';
import { PRESHOW_ORDER, MERCH_SOLDOUT, MERCH_ITEMS, MERCH_NOTES, MERCH_COLS, GLOW_MARKS, P2_ANSWER, STANDS } from '../src/game/data';
import type { GameState, PuzzleId } from '../src/game/types';

const ROOT = resolve(__dirname, '..');

// ---- which clue each puzzle needs, mirrored from the world (device → clue closeups)
const CLUES: Record<PuzzleId, string[]> = {
  p1: ['announce6', 'cases', 'p1panel'],
  p2: ['merchBoard', 'merchNotes', 'doorNote', 'dirLock'],
  p3: ['stands', 'rack'],
  p4: ['whiteboard', 'cases', 'soundDesk'],
  p8: ['glowRoll', 'stageFloor'],
  p6: ['truckList', 'cases', 'distro'],
  p5: ['whiteboard', 'lightDesk'],
  meta: ['stageSheet', 'fohsheet', 'dockPanel'],
};
const ITEMS_NEEDED: Partial<Record<PuzzleId, string[]>> = { p6: ['drum'] };

function stateWith(solved: PuzzleId[], seen: string[], items: string[] = []): GameState {
  const s = initialState();
  solved.forEach((p) => { s.solved[p] = true; });
  seen.forEach((f) => { s.flags[`seen:${f}`] = true; });
  s.items = [...s.items, ...items] as GameState['items'];
  return s;
}

describe('puzzle dependency graph', () => {
  it('is acyclic', () => {
    const seen = new Set<PuzzleId>();
    const stack = new Set<PuzzleId>();
    const visit = (id: PuzzleId) => {
      if (stack.has(id)) throw new Error(`cycle at ${id}`);
      if (seen.has(id)) return;
      stack.add(id);
      PUZZLES.find((p) => p.id === id)!.after.forEach(visit);
      stack.delete(id);
      seen.add(id);
    };
    expect(() => PUZZLES.forEach((p) => visit(p.id))).not.toThrow();
  });

  it('every puzzle becomes solvable once its clues and prerequisites exist', () => {
    for (const p of PUZZLES) {
      const solvedBefore = p.after;
      const deep = new Set<PuzzleId>();
      const add = (id: PuzzleId) => { deep.add(id); PUZZLES.find((x) => x.id === id)!.after.forEach(add); };
      solvedBefore.forEach(add);
      const clues = [...new Set([...deep].flatMap((d) => CLUES[d]).concat(CLUES[p.id]))];
      const items = [...new Set([...deep].flatMap((d) => ITEMS_NEEDED[d] ?? []).concat(ITEMS_NEEDED[p.id] ?? []))];
      const s = stateWith([...deep], clues, items);
      expect(puzzleStatus(s, p), `${p.id} should be ready`).toBe('ready');
    }
  });

  it('reports "information missing" before the clues are found', () => {
    for (const p of PUZZLES) {
      const s = stateWith([], [p.device]);
      expect(puzzleStatus(s, p), `${p.id} should be lacking`).toBe('lacking');
    }
  });

  it('has a valid full ordering reachable from the start (no dead ends)', () => {
    const order: PuzzleId[] = [];
    const solved: PuzzleId[] = [];
    const allClues = new Set<string>();
    let guard = 0;
    while (order.length < PUZZLES.length && guard++ < 50) {
      for (const p of PUZZLES) {
        if (solved.includes(p.id)) continue;
        if (p.after.every((a) => solved.includes(a))) {
          CLUES[p.id].forEach((c) => allClues.add(c));
          (ITEMS_NEEDED[p.id] ?? []).forEach(() => undefined);
          const s = stateWith(solved, [...allClues], ['drum']);
          expect(puzzleStatus(s, p)).toBe('ready');
          solved.push(p.id);
          order.push(p.id);
        }
      }
    }
    expect(order.length).toBe(PUZZLES.length);
    expect(order[0]).toBe('p1');
    expect(order[order.length - 1]).toBe('meta');
  });

  it('opens at least two parallel lines after the first puzzle', () => {
    const openAfterP1 = PUZZLES.filter((p) => p.id !== 'p1' && p.after.every((a) => a === 'p1'));
    expect(openAfterP1.length).toBeGreaterThanOrEqual(2);
  });
});

describe('answer checks', () => {
  it('accepts only the intended answers', () => {
    expect(checkP1(['D5', 'E5', 'F5'])).toBe(true);
    expect(checkP1(['F5', 'E5', 'D5'])).toBe(true);
    expect(checkP1(['C5', 'D5', 'E5'])).toBe(false);
    expect(checkP1(['E5', 'F5'])).toBe(false);
    expect(checkP2(P2_ANSWER)).toBe(true);
    expect(checkP2(['U', 'R', 'U', 'R', 'D'])).toBe(false);
    expect(checkP3([...PRESHOW_ORDER])).toBe(true);
    expect(checkP3(['S1', 'S3', 'S4', 'S2', 'S5'])).toBe(false);
    expect(checkP4('CH6', ['HOUSE', 'LOBBY', 'BS-SL-2'])).toBe(true);
    expect(checkP4('CH6', ['HOUSE', 'LOBBY', 'BS-SR-2'])).toBe(false);
    expect(checkP4('CH5', ['HOUSE', 'LOBBY', 'BS-SL-2'])).toBe(false);
    expect(checkP5(GLOW_MARKS.map((m) => `${m.side},${m.depth}`))).toBe(true);
    // the un-rotated (naive) reading must be rejected
    expect(checkP5(GLOW_MARKS.map((m) => `${-m.side},${m.depth}`))).toBe(false);
    expect(checkP6(['FOH', 'LX-SL', 'DOCK SHT'])).toBe(true);
    expect(checkP6(['FOH', 'LX-SR', 'DOCK SHT'])).toBe(false);
    expect(checkMeta('E5', 'TL', 6)).toBe(true);
    expect(checkMeta('B5', 'TL', 6)).toBe(false); // 図面の向きを取り違えた場合
    expect(checkMeta('E5', 'TR', 6)).toBe(false);
    expect(checkMeta('E5', 'TL', 5)).toBe(false);
  });

  it('P2 path is derivable from the board and the notes', () => {
    // sold-out items sorted by the time written on the sticky notes
    const times = new Map(MERCH_NOTES.map((n) => [n.text.replace(/ 完売.*/, ''), n.time]));
    const order = [...MERCH_SOLDOUT].sort((a, b) => {
      const ta = times.get(MERCH_ITEMS[a - 1])!, tb = times.get(MERCH_ITEMS[b - 1])!;
      return ta.localeCompare(tb);
    });
    const dirs = order.slice(1).map((n, i) => {
      const prev = order[i];
      const [pr, pc] = [Math.floor((prev - 1) / MERCH_COLS), (prev - 1) % MERCH_COLS];
      const [cr, cc] = [Math.floor((n - 1) / MERCH_COLS), (n - 1) % MERCH_COLS];
      if (cr === pr - 1 && cc === pc) return 'U';
      if (cr === pr + 1 && cc === pc) return 'D';
      if (cc === pc + 1 && cr === pr) return 'R';
      if (cc === pc - 1 && cr === pr) return 'L';
      return '?';
    });
    expect(dirs).toEqual(P2_ANSWER); // every step is between neighbouring tiles
  });

  it('P3 stands are distinguishable by the information visible in each place', () => {
    const photoKeys = STANDS.map((s) => `${s.colorName}/${s.height}`);
    expect(new Set(photoKeys).size).toBe(STANDS.length); // photo: colour + height is unique
    const nowKeys = STANDS.map((s) => `${s.colorName}/${s.height}/${s.vase}`);
    expect(new Set(nowKeys).size).toBe(STANDS.length);
  });
});

describe('save data', () => {
  it('migrates older versions and rejects newer ones', () => {
    const old = { ...initialState(), version: 1, solved: { p1: true } };
    const m = migrate(old);
    expect(m?.version).toBe(SAVE_VERSION);
    expect(m?.solved.p1).toBe(true);
    expect(migrate({ version: SAVE_VERSION + 1 })).toBeNull();
    expect(migrate(null)).toBeNull();
    expect(migrate({})).toBeNull();
  });
});

describe('assets', () => {
  it('every image in the manifest exists', () => {
    const src = readFileSync(resolve(ROOT, 'src/game/assets.ts'), 'utf8');
    const names = [...src.matchAll(/'([a-z0-9_]+)'(?=,|\s*\])/g)].map((m) => m[1]);
    const files = new Set(readdirSync(resolve(ROOT, 'public/img')));
    const missing = names.filter((n) => !files.has(`${n}.webp`));
    expect(missing).toEqual([]);
  });

  it('references no image outside the manifest', () => {
    const files = readdirSync(resolve(ROOT, 'src'), { recursive: true }) as string[];
    const used = new Set<string>();
    for (const f of files) {
      if (!/\.tsx?$/.test(f)) continue;
      const txt = readFileSync(resolve(ROOT, 'src', f), 'utf8');
      for (const m of txt.matchAll(/img\('([^']+)'\)/g)) used.add(m[1]);
    }
    const manifest = readFileSync(resolve(ROOT, 'src/game/assets.ts'), 'utf8');
    const missing = [...used].filter((u) => !manifest.includes(`'${u}'`));
    expect(missing).toEqual([]);
  });
});
