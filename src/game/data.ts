/**
 * World data shared by the document views, puzzle UIs and answer checks.
 * Tweak puzzle content here — views and checks read from these tables.
 *
 * 会場（マリンメッセ福岡A館）の構造は公開情報に合わせてある：
 *   アリーナ床は約102m×79m（約8,062㎡）の長方形、天井高は最大30m、
 *   そのアリーナを1階スタンド（A〜Rブロック／1〜18列）と2階スタンド（1〜8列）が四方から囲む。
 *   コンサート時の収容は約11,000〜13,000人。アリーナ席は公演ごとの仮設。
 * アリーナのブロック記号は公演ごとに変わるため、本作では A〜F × 1〜5段（1ブロック12列）とした。
 */
export const VENUE = {
  name: 'マリンメッセ福岡A館',
  arenaSize: '約102m × 約79m',
  ceiling: '最大30m',
  standsF1: '1階スタンド A〜Rブロック（1〜18列）',
  standsF2: '2階スタンド（1〜8列）',
  open: '16:30',
  start: '18:00',
};

// ---------- arena ----------
/** audience-view left→right. A が下手側、F が上手側 */
export const BLOCK_COLS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
/** 1 = ステージに最も近い段 */
export const BLOCK_ROWS = [1, 2, 3, 4, 5] as const;
export const PLAYER_SEAT = { block: 'E5', row: 57, seat: 7 };
/** 最終案内の対象＝最後方の段の上手側 */
export const LAST_GROUP = ['D5', 'E5', 'F5'];
/** 各ブロックが受け持つ列の範囲（1段あたり12列） */
export const ROWS_PER_BLOCK = 12;

// ---------- merch (P2) ----------
/**
 * 会場で販売されていた「濱岸ひより考案グッズ」の実際のラインナップ（名称・税込価格）。
 * tile n = index + 1、ボードは 2列 × 4段
 */
export const MERCH_COLS = 2;
export const MERCH_ITEMS = [
  '好きなものかき集め\nビッグTシャツ', 'ばいころまる〜 Tシャツ',
  '最近の濱岸ひよりステッカー\n（4枚1セット）', 'いつも見えるところに\nひよたん貼っといてねッカー',
  'ひよるのっぷ（ヘアクリップ）', '楽しさ二割増餃子皿',
  'ボンフィンキーホルダー\n濱岸ひよりVer.〈Type-A〉', 'ボンフィンキーホルダー\n濱岸ひよりVer.〈Type-B〉',
];
export const MERCH_PRICES = ['¥4,300', '¥4,500', '¥1,200', '¥900', '¥1,500', '¥4,000', '¥2,500', '¥2,500'];
export const MERCH_SOLDOUT = [7, 5, 6, 4, 3, 1, 2]; // ボードに貼られた完売マグネット
/** tile は商品ボードの番号。完売マグネットの無い商品（Type-B）はひっかけ */
export const MERCH_NOTES: { text: string; time: string; rot: number; tile: number }[] = [
  { text: '楽しさ二割増餃子皿 完売', time: '17:20', rot: -3, tile: 6 },
  { text: 'ボンフィンキーホルダー Type-A 完売', time: '16:05', rot: 2, tile: 7 },
  { text: 'ボンフィンキーホルダー Type-B 一時完売 → 追加入荷', time: '17:05', rot: -1, tile: 8 },
  { text: '最近の濱岸ひよりステッカー 完売', time: '18:10', rot: 4, tile: 3 },
  { text: 'ひよるのっぷ（ヘアクリップ）完売', time: '16:48', rot: -4, tile: 5 },
  { text: 'ばいころまる〜 Tシャツ 完売（終演後販売分）', time: '20:41', rot: 1, tile: 2 },
  { text: 'いつも見えるところにひよたん貼っといてねッカー 完売', time: '17:52', rot: -2, tile: 4 },
  { text: '好きなものかき集めビッグTシャツ 完売', time: '18:26', rot: 3, tile: 1 },
];
export type Dir = 'U' | 'D' | 'L' | 'R';
export const P2_ANSWER: Dir[] = ['U', 'R', 'U', 'L', 'U', 'R'];

// ---------- flowers (P3) ----------
/**
 * 祝花は写真に実際に写っている5基（撮影した画像から読み取って定義している）。
 * 見分けは「花の色＋種類」で、オレンジ2基はバラとガーベラで区別できる。
 */
export interface Stand {
  id: 'S1' | 'S2' | 'S3' | 'S4' | 'S5';
  color: string; colorName: string; flower: string;
  vase: 'round' | 'square';
  sender: string;
  back?: string;
}
export const STANDS: Stand[] = [
  { id: 'S1', color: '#f2efe6', colorName: '白', flower: 'ユリ', vase: 'square', sender: '福岡のおひさま一同' },
  { id: 'S2', color: '#f08a2c', colorName: 'オレンジ', flower: 'ガーベラ', vase: 'square', sender: '二期生を見守る会' },
  { id: 'S3', color: '#7cc4ea', colorName: '空色', flower: 'アジサイ', vase: 'square', sender: '日向坂46を応援する\nおひさま有志' },
  { id: 'S4', color: '#f3d23c', colorName: '黄色', flower: 'ひまわり', vase: 'round', sender: '九州遠征組より' },
  { id: 'S5', color: '#f08a2c', colorName: 'オレンジ', flower: 'バラ', vase: 'square', sender: 'ひより推し有志一同', back: '福岡に、おかえりなさい。\nそして、いってらっしゃい。' },
];
/** 開演前の写真での並び（1 が入口側＝写真の左）。写真の見たままに合わせてある */
export const PRESHOW_ORDER: Stand['id'][] = ['S3', 'S5', 'S1', 'S2', 'S4'];
/** いま並んでいる順（祝花エリアの写真の左→右） */
export const CART_ORDER: Stand['id'][] = ['S1', 'S2', 'S3', 'S4', 'S5'];
/** 机の上に外されている札の並び */
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
/** 位置は 上手＝プラス、下手＝マイナスの −5〜5、奥行きは 1（前端）〜3（奥） */
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
/** 舞台側から見た図では、上手（F）が左に来る */
export const STAGE_VIEW_COLS = [...BLOCK_COLS].reverse();
/** 退場確認の記録（●の数）。5段目の D・E・F だけ記録がない */
export const CHECK_DOTS: Record<string, number> = (() => {
  const dots: Record<string, number> = {};
  for (const c of BLOCK_COLS) for (const r of BLOCK_ROWS) dots[`${c}${r}`] = r < 5 ? 1 : 'ABC'.includes(c) ? 2 : 0;
  return dots;
})();
/** 舞台側から見た図での客席扉。TL＝上手後方＝P1で解錠した扉4 */
export const DOORS = ['TL', 'TR', 'BL', 'BR'] as const;
export const META_ANSWER = { block: PLAYER_SEAT.block, door: 'TL', gate: 6 };
