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
      '原稿の言葉を、この会場で目に見えるものに置き換えよう。「上手」がどちら側かは、ステージの前に書いてある。',
      '「上手」と書かれたケースは、客席から見て右にある。「いちばん遠い列」は3列目。当てはまる区画は2つ。',
    ],
    answer: 'C3 と D3 を選んで「再案内」。',
  },
  {
    id: 'p2', name: '売り切れた順', place: 'ロビー・物販', device: 'dirLock', after: ['p1'],
    info: (s) => seen(s, 'merchBoard') && seen(s, 'merchNotes') && seen(s, 'doorNote'),
    hints: [
      '扉のメモが言う「売り切れた順」を記録した物が、物販のどこかにある。',
      '付箋の時刻で順番が決まる。順番に並べた商品は、ボードの上ではそれぞれ「場所」を持っている。',
      'ボード上の場所を時刻順に一筆書きでたどり、進んだ向きを錠に入れる。マグネットが付いていない商品は数えない。',
    ],
    answer: '↑ → ↑ → ↑ ←（ブランケット→トートバッグ→缶バッジ→ペンライト→ラバーバンド→マフラータオル→ツアーTシャツ(黒)）',
  },
  {
    id: 'p3', name: '祝花の札', place: 'ロビー・祝花エリア', device: 'rack', after: ['p1'],
    info: (s) => seen(s, 'stands') && seen(s, 'rack'),
    hints: [
      'あなたは開演前、この場所の写真を撮っている。',
      '写真で見える特徴（花の色・高さ）と、今見える特徴（花器・札の跡）は同じではない。両方に共通する特徴で橋を架けよう。',
      '入口は写真の左。オレンジの2基は色では決まらない。高さ→花器の札跡の形→札の形の順で区別できる。',
    ],
    answer: '1 そらいろ（日向坂46を応援するおひさま有志）→ 2 オレンジ丸（福岡のおひさま一同）→ 3 きいろ（二期生を見守る会）→ 4 しろ（九州遠征組より）→ 5 オレンジ角（ひより推し 有志一同）',
  },
  {
    id: 'p4', name: '場内放送の回線', place: '客席・FOH 音響卓', device: 'soundDesk', after: ['p3'],
    info: (s) => seen(s, 'whiteboard') && seen(s, 'cases'),
    hints: [
      '卓は、今も生きている音がどれかをずっと表示している。行き先については、スタッフの誰かが書き残している。',
      '搬入口のスピーカーについてのメモは、廊下にある。「下手」「上手」は卓では英語表記になっている。',
      '英語表記と日本語表記の対応は、ステージ前のケースに並んで書かれている。予備回線の番号は卓の凡例にある。',
    ],
    answer: '入力 CH6 → HOUSE・LOBBY・BS-SL-2',
  },
  {
    id: 'p8', name: '暗転の印', place: 'ステージ上', device: 'stageFloor', after: ['p3'],
    info: (s) => seen(s, 'glowRoll'),
    hints: [
      '暗転の中でも出演者が迷わないための印が、ステージには残っている。',
      'その印を光らせる条件が、袖のどこかに書いてある。あなたの持ち物は、今どんな色で光っている？',
      'ペンライトを観察して色を白か青系に切り替え、ステージの床に使ってみよう。',
    ],
    answer: 'ペンライトを白（または空色）にして床を照らす。',
  },
  {
    id: 'p6', name: '仮設分電盤', place: 'バックヤード', device: 'distro', after: ['p2'],
    info: (s) => has(s, 'drum') && seen(s, 'truckList') && seen(s, 'cases'),
    hints: [
      '分電盤に貼られた制限と、「今この建物に残っている機材」を見比べよう。',
      '積込チェック表は機材を「テープの色」でしか書いていない。その色の意味は、ゲーム開始直後から見えている。',
      'ステージ前のケースで、赤＝上手（SL）、青＝下手（SR）、黄＝中央（CTR）。積み込み済みの系統を外すと、ちょうど3つ残る。',
    ],
    answer: 'ドラムで入力をつなぎ、LX-SL・FOH・DOCK SHT の3つを入れる。',
  },
  {
    id: 'p5', name: '暗転明けのフォーカス', place: '客席・FOH 照明卓', device: 'lightDesk', after: ['p6', 'p8'],
    info: (s) => seen(s, 'whiteboard'),
    hints: [
      '消えたフォーカスデータを組み直すための位置を、暗いステージがずっと持っている。',
      'ステージの床を見た時、あなたはどちらを向いていた？ 照明卓の前に立つ今は？',
      '舞台の上から客席を向いて見た配置を、客席側から見ると、左右も前後も逆になる（180°回転）。',
    ],
    answer: '卓の平面図で：奥の列の0／中の列の右3と左4／手前の列の右1と左2。',
  },
  {
    id: 'meta', name: '残留者対応モード', place: '搬入口・館内制御盤', device: 'dockPanel', after: ['p4', 'p5', 'p6'],
    info: (s) => seen(s, 'stageSheet') && seen(s, 'fohsheet'),
    hints: [
      'この図面は、誰の視点で描かれている？ そして、確認記録が一度も付いていない区画は？',
      '記録のない区画は二つ。あなたの席はチケットに書いてある。舞台側のチェック表の文字の振り方を思い出そう。',
      '舞台側から見ると上手は左。Cは中央寄り。扉はあなたが通ってきたもの、ゲートは放送が告げた番号。',
    ],
    answer: '上段の左から2番目（C3）→ 上段左の扉 → 6番ゲート',
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
