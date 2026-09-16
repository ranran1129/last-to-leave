/**
 * World data shared by the document views, puzzle UIs and answer checks.
 * Tweak puzzle content here — views and checks read from these tables.
 */

// ---------- arena ----------
export const BLOCK_COLS = ['A', 'B', 'C', 'D'] as const; // audience-view left→right (A = 下手, D = 上手)
export const BLOCK_ROWS = [1, 2, 3] as const; // 1 = nearest the stage
export const PLAYER_SEAT = { block: 'C3', row: 14, seat: 7 };
export const LAST_GROUP = ['C3', 'D3'];

// ---------- merch (P2) ----------
/** tile n = index + 1, laid out on the board as 3 columns × 4 rows */
export const MERCH_COLS = 3;
export const MERCH_ITEMS = [
  'ツアーTシャツ(白)', 'ツアーTシャツ(黒)', 'マフラータオル',
  'フェイスタオル', 'ペンライト', 'ラバーバンド',
  'トートバッグ', '缶バッジ', 'キーホルダー',
  'ブランケット', 'ポーチ', 'アクリルスタンド',
];
export const MERCH_SOLDOUT = [10, 7, 8, 5, 6, 3, 2]; // magnets on the board
export const MERCH_NOTES: { text: string; time: string; rot: number }[] = [
  { text: '缶バッジ 完売', time: '17:20', rot: -3 },
  { text: 'ブランケット 完売', time: '16:05', rot: 2 },
  { text: 'フェイスタオル 一部の柄のみ完売（他の柄あり）', time: '17:05', rot: -1 },
  { text: 'マフラータオル 完売', time: '18:26', rot: 4 },
  { text: 'トートバッグ 完売', time: '16:48', rot: -4 },
  { text: 'ツアーTシャツ(黒) 完売（終演後物販）', time: '20:41', rot: 1 },
  { text: 'ペンライト 完売', time: '17:52', rot: -2 },
  { text: 'ラバーバンド 完売', time: '18:10', rot: 3 },
];
export type Dir = 'U' | 'D' | 'L' | 'R';
export const P2_ANSWER: Dir[] = ['U', 'R', 'U', 'R', 'U', 'L'];

// ---------- flowers (P3) ----------
export interface Stand {
  id: 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
  color: string; colorName: string;
  height: 'tall' | 'mid' | 'short';
  vase: 'round' | 'square';
  sender: string;
  back?: string;
}
export const STANDS: Stand[] = [
  { id: 'S1', color: '#f08a2c', colorName: 'オレンジ', height: 'tall', vase: 'round', sender: '福岡のおひさま一同' },
  { id: 'S2', color: '#f2efe6', colorName: 'しろ', height: 'mid', vase: 'square', sender: '九州遠征組より' },
  { id: 'S3', color: '#7cc4ea', colorName: 'そらいろ', height: 'tall', vase: 'square', sender: '日向坂46を応援する\nおひさま有志' },
  { id: 'S4', color: '#f3d23c', colorName: 'きいろ', height: 'short', vase: 'round', sender: '二期生を見守る会' },
  { id: 'S5', color: '#f08a2c', colorName: 'オレンジ', height: 'short', vase: 'square', sender: 'ひより推し 有志一同', back: '福岡に、おかえりなさい。\nそして、いってらっしゃい。' },
];
/** order in the pre-show photo, 1 = entrance side (photo left) */
export const PRESHOW_ORDER: Stand['id'][] = ['S3', 'S1', 'S4', 'S2', 'S5'];
/** order on the carts now (scene left → right) */
export const CART_ORDER: Stand['id'][] = ['S2', 'S5', 'S3', 'S4', 'S1'];
/** order of the loose cards on the table */
export const CARD_PILE: Stand['id'][] = ['S4', 'S2', 'S5', 'S1', 'S3'];

// ---------- sound desk (P4) ----------
export const SOUND_INPUTS = ['CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'CH8'];
export const SOUND_LIVE_INPUT = 'CH6';
export const SOUND_OUTPUTS = ['HOUSE', 'LOBBY', 'DRESS', 'BS-SR-1', 'BS-SR-2', 'BS-SL-1', 'BS-SL-2'] as const;
export const P4_OUTPUTS = ['HOUSE', 'LOBBY', 'BS-SL-2'];
export const SOUND_OUT_STATE: Record<string, string> = {
  HOUSE: 'OK', LOBBY: 'OK', DRESS: '撤収済', 'BS-SR-1': 'NO LOAD', 'BS-SR-2': 'OK', 'BS-SL-1': 'OK', 'BS-SL-2': 'OK',
};

// ---------- stage floor / lighting (P8, P5) ----------
/** positions: side number −5..5 where + = 上手, depth 1 (front edge) .. 3 (upstage) */
export const GLOW_MARKS: { side: number; depth: number }[] = [
  { side: 3, depth: 2 },
  { side: 1, depth: 1 },
  { side: 0, depth: 3 },
  { side: -2, depth: 1 },
  { side: -4, depth: 2 },
];
export const sideLabel = (n: number) => (n === 0 ? '0' : n > 0 ? `上${n}` : `下${-n}`);

// ---------- distro (P6) ----------
export const BREAKERS = ['LX-SL', 'LX-SR', 'LX-CTR', 'SND-SL', 'SND-SR', 'FOH', 'DOCK SHT', 'CATER'] as const;
export const P6_ANSWER = ['LX-SL', 'FOH', 'DOCK SHT'];

// ---------- dock panel (META) ----------
/** stage-view map: columns left→right are D C B A (上手 on the left) */
export const STAGE_VIEW_COLS = ['D', 'C', 'B', 'A'];
export const CHECK_DOTS: Record<string, number> = {
  A1: 1, B1: 1, C1: 1, D1: 1, A2: 1, B2: 1, C2: 1, D2: 1, A3: 2, B3: 2, C3: 0, D3: 0,
};
/** arena doors in stage view: TL = 上手後方 (door 4, the one opened in P1) */
export const DOORS = ['TL', 'TR', 'BL', 'BR'] as const;
export const META_ANSWER = { block: 'C3', door: 'TL', gate: 6 };
