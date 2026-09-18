export type SceneId =
  | 'arena' | 'stagefront' | 'arenaback' | 'arenadoor' | 'foh'
  | 'lobby' | 'gate' | 'merch' | 'stock' | 'flowers'
  | 'corridor' | 'stage' | 'backyard' | 'dock' | 'outside';

export type ItemId = 'ticket' | 'penlight' | 'drum' | 'silvertape';

export type PuzzleId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p8' | 'meta';

export type PenColor = 'orange' | 'white' | 'sky' | 'pink' | 'green';

export type Phase = 'title' | 'intro' | 'play' | 'ending' | 'results';

export interface Photo {
  id: string;
  /** closeup id (document) or `scene:<id>` */
  subject: string;
  label: string;
  at: string; // in-game clock text
}

export interface GameState {
  version: number;
  phase: Phase;
  scene: SceneId;
  prevScene: SceneId | null;
  playMs: number;
  flags: Record<string, boolean>;
  items: ItemId[];
  heldItem: ItemId | null;
  penColor: PenColor;
  solved: Partial<Record<PuzzleId, boolean>>;
  hints: Partial<Record<PuzzleId, number>>;
  answers: Partial<Record<PuzzleId, boolean>>;
  photos: Photo[];
  memos: string[];
  secrets: string[];
  /** partial inputs persisted so a reload does not wipe work in progress */
  scratch: Record<string, unknown>;
  cleared: boolean;
  clearMs: number;
}

export interface Settings {
  volume: number;
  /** BGMの音量（0でBGMを切る） */
  musicVolume: number;
  subtitles: boolean;
  reduceMotion: boolean;
  /** 調べられる場所に目印を出す（スマホでタップ位置が分かりにくいため既定はオン） */
  tapMarks: boolean;
}

export type HotspotKind = 'look' | 'go' | 'take' | 'use';

export interface Hotspot {
  id: string;
  /** x, y, w, h in % of the 16:9 frame */
  rect: [number, number, number, number];
  kind: HotspotKind;
  label: string;
  visible?: (s: GameState) => boolean;
  /** direction arrow for navigation hotspots */
  arrow?: 'left' | 'right' | 'up' | 'down' | 'back';
  onClick: (ctx: ActionCtx) => void;
}

export interface SceneDef {
  id: SceneId;
  name: string;
  image: (s: GameState) => string;
  filter?: (s: GameState) => string;
  flip?: boolean;
  ambience: AmbienceId;
  hotspots: Hotspot[];
}

export type AmbienceId = 'hall' | 'stage' | 'lobby' | 'backstage' | 'dock' | 'outside' | 'none';

export interface ActionCtx {
  s: GameState;
  go: (id: SceneId) => void;
  open: (closeup: string) => void;
  say: (text: string) => void;
  take: (item: ItemId, flag?: string) => void;
  setFlag: (flag: string) => void;
  secret: (id: string, text: string) => void;
  held: ItemId | null;
}
