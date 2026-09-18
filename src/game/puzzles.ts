import type { Dir } from './data';
import {
  LAST_GROUP, P2_ANSWER, PRESHOW_ORDER, SOUND_LIVE_INPUT, P4_OUTPUTS,
  GLOW_MARKS, P6_ANSWER, META_ANSWER,
} from './data';
import type { GameState, PuzzleId } from './types';

export type PuzzleStatus = 'hidden' | 'found' | 'lacking' | 'ready' | 'solved';

export interface PuzzleDef {
  id: PuzzleId;
  name: string;
  place: string;
  /** closeup whose first viewing counts as "discovered" */
  device: string;
  /** puzzles that must be solved before this one can be solved */
  after: PuzzleId[];
  /** information the player must have seen / own */
  info: (s: GameState) => boolean;
  hints: [string, string, string];
  answer: string;
}

const seen = (s: GameState, id: string) => !!s.flags[`seen:${id}`];
const has = (s: GameState, item: string) => s.items.includes(item as never);

export const PUZZLES: PuzzleDef[] = [
  {
    id: 'p1', name: '規制退場パネル', place: '客席・扉4', device: 'p1panel', after: [],
    info: (s) => seen(s, 'announce6') && seen(s, 'cases'),
    hints: [
      '客席のどこかに、係員が最後に読み上げた言葉が残っている。',
      '原稿の言葉を、この会場で目に見えるものに置き換えてみよう。「上手」がどちら側かは、ステージの前に書いてある。',
      '「上手」と書かれたケースは、客席から見て右側にある。「いちばん遠い段」は5段目。当てはまるブロックは3つ。',
    ],
    answer: 'D5・E5・F5 を選んで「最終組 再案内」。',
  },
  {
    id: 'p2', name: '売り切れた順', place: 'コンコース・物販', device: 'dirLock', after: ['p1'],
    info: (s) => seen(s, 'merchBoard') && seen(s, 'merchNotes') && seen(s, 'doorNote'),
    hints: [
      'メモにある「売り切れた順」を記録した物が、物販のどこかにある。',
      '付箋の時刻で順番が決まる。その商品は、ボードの上でそれぞれ決まった場所にある。',
      'ボード上の場所を時刻の早い順に一筆書きでたどり、進んだ向きをそのまま錠に入れる。完売マグネットが付いていない商品は数えない。',
    ],
    answer: '↑ → ↑ ← ↑ →（ボンフィンキーホルダーType-A → ひよるのっぷ → 楽しさ二割増餃子皿 → ひよたん貼っといてねッカー → 最近の濱岸ひよりステッカー → 好きなものかき集めビッグTシャツ → ばいころまる〜Tシャツ）',
  },
  {
    id: 'p3', name: '祝花の札', place: 'コンコース・祝花エリア', device: 'rack', after: ['p1'],
    info: (s) => seen(s, 'stands') && seen(s, 'rack') && seen(s, 'delivery'),
    hints: [
      '開演前に、あなたはこの場所の写真を撮っている。',
      '札には送り主しか書かれていない。送り主と花を結びつける紙が、ボックスのそばにある。',
      '入口は写真の左側。オレンジは2基あるが、バラとガーベラで見分けられる。写真の並び → 納品書 → 札、の順にたどろう。',
    ],
    answer: '1 空色のアジサイ（日向坂46を応援するおひさま有志）→ 2 オレンジのバラ（ひより推し有志一同）→ 3 白のユリ（福岡のおひさま一同）→ 4 オレンジのガーベラ（二期生を見守る会）→ 5 黄色のひまわり（九州遠征組より）',
  },
  {
    id: 'p4', name: '場内放送の回線', place: '客席・FOH 音響卓', device: 'soundDesk', after: ['p3'],
    info: (s) => seen(s, 'whiteboard') && seen(s, 'cases'),
    hints: [
      'いまも信号が来ている入力がどれかは、卓がずっと表示している。行き先については、スタッフの誰かが書き残している。',
      '搬入口のスピーカーについてのメモは、楽屋前の廊下にある。卓では「上手」「下手」が英語表記になっている。',
      '英語表記と日本語表記の対応は、ステージ前のケースに並べて書かれている。予備回線の番号は、卓の凡例にある。',
    ],
    answer: '入力 CH6 → HOUSE・LOBBY・BS-SL-2',
  },
  {
    id: 'p8', name: '暗転の印', place: 'ステージ上', device: 'stageFloor', after: ['p3'],
    info: (s) => seen(s, 'glowRoll'),
    hints: [
      '暗転の中でも出演者が立ち位置を見失わないための印が、ステージには残っている。',
      'その印を光らせる条件は、袖のどこかに書いてある。いま自分の持ち物は、何色で光っている？',
      'ペンライトをよく見て色を白か空色に切り替え、ステージの床に対して使ってみよう。',
    ],
    answer: 'ペンライトを白（または空色）にして、ステージの床を照らす。',
  },
  {
    id: 'p6', name: '仮設分電盤', place: 'バックヤード', device: 'distro', after: ['p2'],
    info: (s) => (has(s, 'drum') || !!s.flags['drumConnected']) && seen(s, 'truckList') && seen(s, 'cases'),
    hints: [
      '分電盤に貼られた制限と、「いまこの建物に残っている機材」を見比べてみよう。',
      '積み込みチェック表には、機材が「テープの色」でしか書かれていない。その色の意味は、最初から目に入っている。',
      'ステージ前のケースで、赤＝上手（SL）、青＝下手（SR）、黄＝中央（CTR）。積み込み済みの系統を外すと、ちょうど3つ残る。',
    ],
    answer: '電源ドラムで入力をつないでから、LX-SL・FOH・DOCK SHT の3系統を入れる。',
  },
  {
    id: 'p5', name: '暗転明けのフォーカス', place: '客席・FOH 照明卓', device: 'lightDesk', after: ['p6', 'p8'],
    info: (s) => seen(s, 'whiteboard'),
    hints: [
      '消えてしまったフォーカスデータを組み直すための位置は、暗いステージがそのまま持っている。',
      'ステージの床を見たとき、自分はどちらを向いていた？ いま照明卓の前に立っているときは？',
      '舞台の上から客席を向いて見た配置は、客席側から見ると左右も前後も逆になる（180度回転）。',
    ],
    answer: '卓の平面図で、奥の段の0／中の段の右3と左4／手前の段の右1と左2。',
  },
  {
    id: 'meta', name: '残留者対応モード', place: '搬入口・館内制御盤', device: 'dockPanel', after: ['p4', 'p5', 'p6'],
    info: (s) => seen(s, 'stageSheet') && seen(s, 'fohsheet'),
    hints: [
      'この図面は、誰の視点で描かれている？ そして、確認の記録が一度も付いていないブロックはどれ？',
      '記録のないブロックは3つ。自分の席はチケットに書いてある。舞台側のチェック表で、記号がどう振られていたかも思い出そう。',
      '舞台側から見ると、上手（E・F）は左側に来る。扉は自分が通ってきたもの、出口は放送が告げた番号。',
    ],
    answer: '上の段の左から2番目（E5）→ 上段左の客席扉 → 出口6',
  },
];

export const puzzleById = (id: PuzzleId) => PUZZLES.find((p) => p.id === id)!;

export function puzzleStatus(s: GameState, p: PuzzleDef): PuzzleStatus {
  if (s.solved[p.id]) return 'solved';
  if (!s.flags[`seen:${p.device}`]) return 'hidden';
  const blocked = p.after.some((a) => !s.solved[a]) || !p.info(s);
  return blocked ? 'lacking' : 'ready';
}

// ---------------- answer checks (pure) ----------------
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export const checkP1 = (sel: string[]) => sameSet(sel, LAST_GROUP);
export const checkP2 = (seq: Dir[]) => seq.length === P2_ANSWER.length && seq.every((d, i) => d === P2_ANSWER[i]);
export const checkP3 = (slots: (string | null)[]) => slots.every((c, i) => c === PRESHOW_ORDER[i]);
export const checkP4 = (input: string | null, outs: string[]) => input === SOUND_LIVE_INPUT && sameSet(outs, P4_OUTPUTS);
/** cells use FOH-view coordinates: side + = right (上手), depth 1 = nearest */
export const checkP5 = (cells: string[]) => sameSet(cells, GLOW_MARKS.map((m) => `${m.side},${m.depth}`));
export const checkP6 = (on: string[]) => sameSet(on, P6_ANSWER);
export const checkMeta = (block: string | null, door: string | null, gate: number | null) =>
  block === META_ANSWER.block && door === META_ANSWER.door && gate === META_ANSWER.gate;
