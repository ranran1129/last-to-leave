import type { GameState, Hotspot, SceneDef, SceneId } from './types';
import { img } from './assets';
import { setFlag, solve } from './engine';
import { sfx } from '../audio/audio';
import { setState } from './store';
import { setUI } from './ui';
import { PLAYER_SEAT } from './data';

const back = (to: SceneId, label = '戻る', rect: [number, number, number, number] = [2, 76, 14, 22]): Hotspot => ({
  id: `back-${to}`, rect, kind: 'go', label, arrow: 'back', onClick: (c) => c.go(to),
});

export const SCENES: Record<SceneId, SceneDef> = {
  // ---------------------------------------------------------------- アリーナ
  arena: {
    id: 'arena', name: `アリーナ ${PLAYER_SEAT.block}ブロック`, image: () => img('arena'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.7) saturate(1.05)' : 'brightness(1.08)'),
    hotspots: [
      { id: 'to-stagefront', rect: [30, 29, 25, 20], kind: 'go', label: 'ステージの方へ', arrow: 'up', onClick: (c) => c.go('stagefront') },
      { id: 'announce', rect: [29, 73, 12, 11], kind: 'look', label: '椅子に置かれたバインダー', onClick: (c) => c.open('announce6') },
      { id: 'tape', rect: [54, 72, 12, 11], kind: 'take', label: '床に落ちているもの', visible: (s) => !s.items.includes('silvertape'), onClick: (c) => {
        c.take('silvertape');
        c.secret('silvertape', '銀テープが一本、椅子の下に残っていた。「ひよたん♪ひよたん♪」と繰り返し印刷されている。');
      } },
      { id: 'myseat', rect: [67, 60, 16, 14], kind: 'look', label: '自分の座席', onClick: (c) => c.say(`椅子の背に貼られた座席番号は「${PLAYER_SEAT.block} ${PLAYER_SEAT.row}列 ${PLAYER_SEAT.seat}番」。ここに座っていた。`) },
      { id: 'to-arenaback', rect: [80, 78, 19, 20], kind: 'go', label: '後ろを振り返る', arrow: 'down', onClick: (c) => c.go('arenaback') },
    ],
  },
  stagefront: {
    id: 'stagefront', name: 'ステージ前', image: () => img('stagefront'), ambience: 'stage',
    filter: (s) => (s.solved.p5 ? 'brightness(1.25)' : 'none'),
    hotspots: [
      { id: 'cases-l', rect: [2, 34, 20, 20], kind: 'look', label: '下手側のケース', onClick: (c) => c.open('cases') },
      { id: 'cases-c', rect: [41, 34, 12, 18], kind: 'look', label: '中央のケース', onClick: (c) => c.open('cases') },
      { id: 'cases-r', rect: [78, 38, 20, 18], kind: 'look', label: '上手側のケース', onClick: (c) => c.open('cases') },
      { id: 'climb', rect: [28, 56, 44, 22], kind: 'look', label: 'ステージの端', onClick: (c) => c.say('胸より高い。柵の内側だし、よじ登るのはやめておこう。') },
      back('arena', 'アリーナへ戻る'),
    ],
  },
  arenaback: {
    id: 'arenaback', name: 'アリーナ 後方', image: () => img('arenaback'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.45)' : 'brightness(0.95)'),
    hotspots: [
      { id: 'to-door', rect: [28, 50, 9, 12], kind: 'go', label: '客席扉4へ', arrow: 'up', onClick: (c) => c.go('arenadoor') },
      { id: 'to-foh', rect: [38, 59, 31, 13], kind: 'go', label: '音響・照明卓へ', arrow: 'right', onClick: (c) => c.go('foh') },
      back('arena', 'ステージの方を向く'),
    ],
  },
  arenadoor: {
    id: 'arenadoor', name: '客席扉4', image: () => img('arenadoor'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.9)' : 'brightness(1.35)'),
    hotspots: [
      { id: 'panel', rect: [44, 28, 13, 30], kind: 'look', label: '壁の制御盤', onClick: (c) => c.open('p1panel') },
      { id: 'door', rect: [13, 22, 27, 67], kind: 'go', label: '扉', arrow: 'up', onClick: (c) => {
        if (c.s.solved.p1) c.go('lobby');
        else { sfx('lock'); c.say('押しても引いても動かない。上下に電気錠がかかっている。'); }
      } },
      back('arenaback', '客席へ戻る'),
    ],
  },
  foh: {
    id: 'foh', name: 'FOH（音響・照明卓）', image: () => img('foh'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.25)' : 'none'),
    hotspots: [
      { id: 'sound', rect: [9, 42, 34, 26], kind: 'look', label: '音響卓', onClick: (c) => c.open('soundDesk') },
      { id: 'light', rect: [45, 42, 38, 26], kind: 'look', label: '照明卓', onClick: (c) => c.open('lightDesk') },
      { id: 'clip', rect: [37, 69, 14, 12], kind: 'look', label: 'クリップボード', onClick: (c) => c.open('fohsheet') },
      back('arenaback', '客席へ戻る'),
    ],
  },

  // ---------------------------------------------------------------- コンコース
  lobby: {
    id: 'lobby', name: 'コンコース', image: () => img('lobby'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.2)' : 'brightness(0.62) saturate(0.92)'),
    hotspots: [
      { id: 'to-gate', rect: [18, 45, 40, 27], kind: 'go', label: '退場ゲートへ', arrow: 'up', onClick: (c) => c.go('gate') },
      { id: 'to-merch', rect: [59, 53, 25, 19], kind: 'go', label: '物販の跡へ', arrow: 'right', onClick: (c) => c.go('merch') },
      { id: 'to-flowers', rect: [86, 47, 13, 24], kind: 'go', label: '祝花エリアへ', arrow: 'right', onClick: (c) => c.go('flowers') },
      { id: 'to-arena', rect: [1, 44, 10, 30], kind: 'go', label: '客席へ戻る', arrow: 'left', onClick: (c) => c.go('arenadoor') },
    ],
  },
  gate: {
    id: 'gate', name: '退場ゲート', image: () => img('gate'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.1)' : 'brightness(0.7)'),
    hotspots: [
      { id: 'display', rect: [59, 14, 16, 16], kind: 'look', label: 'ゲートの表示', onClick: (c) => c.open('gateDisplay') },
      { id: 'push', rect: [14, 30, 44, 60], kind: 'go', label: '扉を押す', onClick: (c) => {
        if (c.s.solved.meta) {
          sfx('unlock');
          setState((x) => ({ ...x, phase: 'ending', cleared: true, clearMs: x.playMs }));
          setUI({ closeup: null, phoneOpen: false });
        } else { sfx('lock'); c.say('押し棒はびくとも動かない。表示は「閉館処理中」のまま。'); }
      } },
      back('lobby', 'コンコースへ戻る'),
    ],
  },
  merch: {
    id: 'merch', name: '物販ブースの跡', image: () => img('merch'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.1)' : 'brightness(0.66)'),
    hotspots: [
      { id: 'board', rect: [9, 4, 22, 92], kind: 'look', label: '商品一覧の立て看板', onClick: (c) => c.open('merchBoard') },
      { id: 'notes', rect: [42, 70, 22, 14], kind: 'look', label: '会計台の付箋', onClick: (c) => c.open('merchNotes') },
      { id: 'note', rect: [59, 24, 9, 10], kind: 'look', label: '扉に貼られたメモ', onClick: (c) => c.open('doorNote') },
      { id: 'lock', rect: [63, 37, 10, 11], kind: 'look', label: '扉の錠', onClick: (c) => c.open('dirLock') },
      { id: 'stockdoor', rect: [57, 19, 24, 16], kind: 'go', label: 'ストック室へ', arrow: 'up', visible: (s) => !!s.solved.p2, onClick: (c) => c.go('stock') },
      back('lobby', 'コンコースへ戻る'),
    ],
  },
  stock: {
    id: 'stock', name: '物販ストック室', image: (s) => img(s.items.includes('drum') ? 'stock_empty' : 'stock'), ambience: 'backstage',
    filter: () => 'brightness(0.92)',
    hotspots: [
      { id: 'drum', rect: [34, 57, 14, 22], kind: 'take', label: '電源ドラム', visible: (s) => !s.items.includes('drum'), onClick: (c) => {
        c.take('drum');
        c.say('物販ブースの照明に使っていた電源ドラム。コードはまだ十分に残っている。');
      } },
      { id: 'to-backyard', rect: [35, 25, 12, 38], kind: 'go', label: 'バックヤードへ', arrow: 'up', onClick: (c) => c.go('backyard') },
      back('merch', '物販へ戻る'),
    ],
  },
  flowers: {
    id: 'flowers', name: '祝花エリア', image: () => img('flowers'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.0)' : 'brightness(0.62)'),
    hotspots: [
      { id: 'stands', rect: [2, 26, 40, 50], kind: 'look', label: '並べられた祝花', onClick: (c) => c.open('stands') },
      { id: 'rack', rect: [54, 48, 9, 12], kind: 'look', label: '壁のボックス', onClick: (c) => c.open('rack') },
      { id: 'door', rect: [60, 24, 22, 44], kind: 'go', label: '関係者通路', arrow: 'up', onClick: (c) => {
        if (c.s.solved.p3) c.go('corridor');
        else { sfx('lock'); c.say('扉は閉まったまま。横のボックスに「扉開放」と書かれている。'); }
      } },
      back('lobby', 'コンコースへ戻る'),
    ],
  },

  // ---------------------------------------------------------------- バックステージ
  corridor: {
    id: 'corridor', name: '楽屋前廊下', image: () => img('corridor'), ambience: 'backstage',
    filter: (s) => (s.solved.meta ? 'brightness(1.15)' : 'brightness(0.75)'),
    hotspots: [
      { id: 'whiteboard', rect: [57, 14, 24, 48], kind: 'look', label: 'ホワイトボード', onClick: (c) => c.open('whiteboard') },
      { id: 'clip', rect: [52, 37, 6, 14], kind: 'look', label: 'クリップボード', onClick: (c) => c.open('stageSheet') },
      { id: 'to-backyard', rect: [33, 33, 13, 38], kind: 'go', label: 'バックヤードへ', arrow: 'up', onClick: (c) => c.go('backyard') },
      { id: 'to-stage', rect: [2, 55, 13, 32], kind: 'go', label: '舞台袖へ', arrow: 'left', onClick: (c) => c.go('stage') },
      { id: 'to-lobby', rect: [82, 74, 16, 24], kind: 'go', label: 'コンコースへ戻る', arrow: 'back', onClick: (c) => c.go('flowers') },
    ],
  },
  stage: {
    id: 'stage', name: 'ステージ上', image: () => img('stage'), ambience: 'stage',
    filter: (s) => (s.solved.p5 ? 'brightness(2.4) saturate(1.1)' : 'brightness(1.75)'),
    hotspots: [
      { id: 'floor', rect: [20, 66, 60, 30], kind: 'look', label: 'ステージの床', onClick: (c) => {
        if (c.held === 'penlight') {
          const col = c.s.penColor;
          if (col === 'white' || col === 'sky') {
            if (!c.s.solved.p8) {
              sfx('glow');
              solve('p8');
              c.say('白い光をしばらく当ててから、明かりを消す。──床のあちこちに、細い光の印が浮かび上がった。');
            }
            c.open('stageFloor');
          } else {
            c.say('オレンジの光をしばらく当ててみたが、床は何も返してこない。');
          }
        } else c.open('stageFloor');
      } },
      { id: 'wingcase', rect: [0, 56, 14, 22], kind: 'look', label: '袖のケースの上', onClick: (c) => c.open('glowRoll') },
      { id: 'look-house', rect: [30, 20, 40, 30], kind: 'look', label: '客席の方を見る', onClick: (c) => c.say('真っ暗な客席に、非常灯だけが点々と光っている。ここから見ると、自分が座っていた側は──') },
      back('corridor', '廊下へ戻る'),
    ],
  },
  backyard: {
    id: 'backyard', name: 'バックヤード', image: () => img('backyard'), ambience: 'backstage',
    filter: (s) => (s.solved.meta ? 'brightness(1.5)' : 'brightness(1.15)'),
    hotspots: [
      { id: 'distro', rect: [35, 38, 14, 34], kind: 'look', label: '仮設分電盤', onClick: (c) => c.open('distro') },
      { id: 'trucklist', rect: [11, 44, 9, 12], kind: 'look', label: 'ケースのクリップボード', onClick: (c) => c.open('truckList') },
      { id: 'cable', rect: [30, 72, 22, 16], kind: 'use', label: '床を這う入力ケーブル', onClick: (c) => {
        if (c.s.flags['drumConnected']) { c.say('電源ドラムで延長した入力ケーブルが、分電盤までつながっている。'); return; }
        if (c.held === 'drum') {
          sfx('pickup');
          setFlag('drumConnected');
          c.say('電源ドラムをつなぐと、入力ケーブルが分電盤まで届いた。盤のINPUTランプが点く。');
        } else c.say('発電車から来ている入力ケーブル。途中まで巻き取られていて、分電盤まで数メートル足りない。');
      } },
      { id: 'shutter', rect: [52, 6, 26, 56], kind: 'go', label: '搬入口のシャッター', arrow: 'up', onClick: (c) => {
        if (c.s.solved.p6) c.go('dock');
        else { sfx('lock'); c.say('電動シャッター。操作盤のランプは消えたままだ。'); }
      } },
      { id: 'to-corridor', rect: [0, 40, 10, 34], kind: 'go', label: '楽屋前廊下へ', arrow: 'left', onClick: (c) => c.go('corridor') },
      { id: 'to-stock', rect: [2, 78, 16, 20], kind: 'go', label: '物販ストック室へ', arrow: 'back', onClick: (c) => c.go('stock') },
    ],
  },
  dock: {
    id: 'dock', name: '搬入口', image: () => img('dock'), ambience: 'dock',
    filter: (s) => (s.solved.meta ? 'brightness(1.2)' : 'brightness(0.9)'),
    hotspots: [
      { id: 'panel', rect: [3, 44, 15, 34], kind: 'look', label: '館内制御盤', onClick: (c) => c.open('dockPanel') },
      { id: 'truck', rect: [40, 34, 17, 32], kind: 'look', label: 'トラックの荷台', onClick: (c) => {
        c.open('truckChalk');
        c.secret('chalk', '空の荷台の壁に、チョークで一行だけ書かれていた。「また、どこかの会場で」');
      } },
      { id: 'outside', rect: [76, 28, 20, 34], kind: 'look', label: '外', onClick: (c) => c.say('シャッターの外はトラックヤード。フェンスの向こうは道路だ。ここから出るのは、さすがにまずい。') },
      back('backyard', 'バックヤードへ戻る'),
    ],
  },
  outside: {
    id: 'outside', name: '会場の外', image: () => img('outside'), ambience: 'outside', hotspots: [],
  },
};
