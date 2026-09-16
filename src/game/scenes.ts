import type { GameState, Hotspot, SceneDef, SceneId } from './types';
import { img } from './assets';
import { setFlag, solve } from './engine';
import { sfx } from '../audio/audio';
import { setState } from './store';
import { setUI } from './ui';

const lit = (s: GameState, k = 1.5) => (s.solved.meta ? `brightness(${k})` : 'none');

const back = (to: SceneId, label = '戻る', rect: [number, number, number, number] = [2, 78, 13, 20]): Hotspot => ({
  id: `back-${to}`, rect, kind: 'go', label, arrow: 'back', onClick: (c) => c.go(to),
});

export const SCENES: Record<SceneId, SceneDef> = {
  // ---------------------------------------------------------------- ARENA
  arena: {
    id: 'arena', name: 'アリーナ C3ブロック', image: () => img('arena'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.6) saturate(1.05)' : 'none'),
    hotspots: [
      { id: 'to-stagefront', rect: [34, 22, 32, 30], kind: 'go', label: 'ステージの方へ', arrow: 'up', onClick: (c) => c.go('stagefront') },
      { id: 'announce', rect: [7, 60, 15, 26], kind: 'look', label: 'パイプ椅子の上のバインダー', onClick: (c) => c.open('announce6') },
      { id: 'myseat', rect: [40, 74, 20, 22], kind: 'look', label: '自分の席の足もと', onClick: (c) => {
        if (!c.s.items.includes('silvertape')) {
          c.take('silvertape');
          c.secret('silvertape', '足もとに、銀テープが一本だけ残っていた。誰にも拾われなかったらしい。');
        } else c.say('座席番号のシールは「C3 - 14 - 7」。ここに座っていた。');
      } },
      { id: 'to-arenaback', rect: [78, 74, 20, 24], kind: 'go', label: '後ろを向く', arrow: 'down', onClick: (c) => c.go('arenaback') },
    ],
  },
  stagefront: {
    id: 'stagefront', name: 'ステージ前', image: () => img('stagefront'), ambience: 'stage',
    filter: (s) => (s.solved.p5 ? 'brightness(1.25)' : 'none'),
    hotspots: [
      { id: 'cases-l', rect: [2, 34, 20, 20], kind: 'look', label: '下手側のケース', onClick: (c) => c.open('cases') },
      { id: 'cases-c', rect: [41, 34, 12, 18], kind: 'look', label: '中央のケース', onClick: (c) => c.open('cases') },
      { id: 'cases-r', rect: [78, 38, 20, 18], kind: 'look', label: '上手側のケース', onClick: (c) => c.open('cases') },
      { id: 'climb', rect: [28, 56, 44, 22], kind: 'look', label: 'ステージの縁', onClick: (c) => c.say('胸の高さより上。柵の内側だし、よじ登るのはやめておこう。') },
      back('arena', 'アリーナへ戻る'),
    ],
  },
  arenaback: {
    id: 'arenaback', name: 'アリーナ 後方', image: () => img('arenaback'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.35)' : 'brightness(0.78)'),
    hotspots: [
      { id: 'to-door', rect: [22, 38, 18, 34], kind: 'go', label: '客席扉4へ', arrow: 'up', onClick: (c) => c.go('arenadoor') },
      { id: 'to-foh', rect: [49, 50, 33, 26], kind: 'go', label: '音響・照明卓へ', arrow: 'right', onClick: (c) => c.go('foh') },
      back('arena', 'ステージの方を向く'),
    ],
  },
  arenadoor: {
    id: 'arenadoor', name: '客席扉4', image: () => img('arenadoor'), ambience: 'hall',
    filter: (s) => (s.solved.meta ? 'brightness(1.9)' : 'brightness(1.35)'),
    hotspots: [
      { id: 'panel', rect: [46, 33, 12, 26], kind: 'look', label: '壁の制御箱', onClick: (c) => c.open('p1panel') },
      { id: 'door', rect: [16, 22, 28, 66], kind: 'go', label: '扉', arrow: 'up', onClick: (c) => {
        if (c.s.solved.p1) c.go('lobby');
        else { sfx('lock'); c.say('押しても引いても動かない。上下に電気錠が掛かっている。'); }
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

  // ---------------------------------------------------------------- LOBBY
  lobby: {
    id: 'lobby', name: 'ロビー', image: () => img('lobby'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.15)' : 'brightness(0.55) saturate(0.9)'),
    hotspots: [
      { id: 'to-gate', rect: [29, 38, 36, 24], kind: 'go', label: '退場ゲートへ', arrow: 'up', onClick: (c) => c.go('gate') },
      { id: 'to-merch', rect: [67, 46, 27, 20], kind: 'go', label: '物販の跡へ', arrow: 'right', onClick: (c) => c.go('merch') },
      { id: 'to-flowers', rect: [5, 38, 14, 26], kind: 'go', label: '祝花エリアへ', arrow: 'left', onClick: (c) => c.go('flowers') },
      { id: 'to-arena', rect: [2, 76, 15, 22], kind: 'go', label: '客席へ戻る', arrow: 'back', onClick: (c) => c.go('arenadoor') },
    ],
  },
  gate: {
    id: 'gate', name: '退場ゲート', image: () => img('gate'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.1)' : 'brightness(0.7)'),
    hotspots: [
      { id: 'display', rect: [59, 14, 16, 16], kind: 'look', label: 'ゲート表示', onClick: (c) => c.open('gateDisplay') },
      { id: 'push', rect: [14, 30, 44, 60], kind: 'go', label: 'ゲートを押す', onClick: (c) => {
        if (c.s.solved.meta) {
          sfx('unlock');
          setState((x) => ({ ...x, phase: 'ending', cleared: true, clearMs: x.playMs }));
          setUI({ closeup: null, phoneOpen: false });
        } else { sfx('lock'); c.say('押し棒はびくとも動かない。表示は「閉館処理中」。'); }
      } },
      back('lobby', 'ロビーへ戻る'),
    ],
  },
  merch: {
    id: 'merch', name: '物販 撤収跡', image: () => img('merch'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.1)' : 'brightness(0.62)'),
    hotspots: [
      { id: 'board', rect: [3, 24, 21, 54], kind: 'look', label: '商品ボード', onClick: (c) => c.open('merchBoard') },
      { id: 'notes', rect: [31, 48, 17, 18], kind: 'look', label: '会計台の付箋', onClick: (c) => c.open('merchNotes') },
      { id: 'note', rect: [53, 24, 12, 14], kind: 'look', label: '扉に貼られたメモ', onClick: (c) => c.open('doorNote') },
      { id: 'lock', rect: [63, 42, 10, 14], kind: 'look', label: '扉の錠', onClick: (c) => c.open('dirLock') },
      { id: 'stockdoor', rect: [53, 38, 12, 34], kind: 'go', label: 'ストック室', arrow: 'up', visible: (s) => !!s.solved.p2, onClick: (c) => c.go('stock') },
      back('lobby', 'ロビーへ戻る'),
    ],
  },
  stock: {
    id: 'stock', name: '物販ストック室', image: (s) => img(s.items.includes('drum') ? 'stock_empty' : 'stock'), ambience: 'backstage',
    filter: () => 'brightness(0.95)',
    hotspots: [
      { id: 'drum', rect: [30, 62, 18, 28], kind: 'take', label: '電源ドラム', visible: (s) => !s.items.includes('drum'), onClick: (c) => {
        c.take('drum');
        c.say('物販の照明用だった電源ドラム。まだ長さに余裕がある。');
      } },
      { id: 'to-backyard', rect: [37, 26, 12, 36], kind: 'go', label: 'バックヤードへ', arrow: 'up', onClick: (c) => c.go('backyard') },
      back('merch', '物販へ戻る'),
    ],
  },
  flowers: {
    id: 'flowers', name: '祝花エリア', image: () => img('flowers'), ambience: 'lobby',
    filter: (s) => (s.solved.meta ? 'brightness(1.0)' : 'brightness(0.62)'),
    hotspots: [
      { id: 'stands', rect: [3, 40, 33, 52], kind: 'look', label: '台車の上の祝花', onClick: (c) => c.open('stands') },
      { id: 'rack', rect: [53, 30, 8, 12], kind: 'look', label: '壁のボックス', onClick: (c) => c.open('rack') },
      { id: 'door', rect: [40, 20, 13, 36], kind: 'go', label: '関係者通路', arrow: 'up', onClick: (c) => {
        if (c.s.solved.p3) c.go('corridor');
        else { sfx('lock'); c.say('扉は閉じたまま。壁のボックスに「扉開放」と書かれている。'); }
      } },
      back('lobby', 'ロビーへ戻る'),
    ],
  },

  // ---------------------------------------------------------------- BACKSTAGE
  corridor: {
    id: 'corridor', name: '楽屋前廊下', image: () => img('corridor'), ambience: 'backstage',
    filter: (s) => (s.solved.meta ? 'brightness(1.15)' : 'brightness(0.75)'),
    hotspots: [
      { id: 'whiteboard', rect: [57, 14, 24, 48], kind: 'look', label: 'ホワイトボード', onClick: (c) => c.open('whiteboard') },
      { id: 'clip', rect: [52, 37, 6, 14], kind: 'look', label: 'クリップボード', onClick: (c) => c.open('stageSheet') },
      { id: 'to-backyard', rect: [33, 33, 13, 38], kind: 'go', label: 'バックヤードへ', arrow: 'up', onClick: (c) => c.go('backyard') },
      { id: 'to-stage', rect: [2, 55, 13, 32], kind: 'go', label: '舞台袖へ', arrow: 'left', onClick: (c) => c.go('stage') },
      { id: 'to-lobby', rect: [82, 76, 16, 22], kind: 'go', label: 'ロビーへ戻る', arrow: 'back', onClick: (c) => c.go('flowers') },
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
              c.say('白い光をしばらく当ててから、明かりを切る。──床のあちこちに、細い光の印が浮かび上がった。');
            }
            c.open('stageFloor');
          } else {
            c.say('オレンジの光をしばらく当ててみたが、床は何も返してこない。');
          }
        } else c.open('stageFloor');
      } },
      { id: 'wingcase', rect: [0, 56, 14, 22], kind: 'look', label: '袖のケースの上', onClick: (c) => c.open('glowRoll') },
      { id: 'look-house', rect: [30, 20, 40, 30], kind: 'look', label: '客席の方を見る', onClick: (c) => c.say('真っ暗な客席。非常灯だけが、遠くに点々と光っている。ここから見ると、自分が座っていた側は──') },
      back('corridor', '廊下へ戻る'),
    ],
  },
  backyard: {
    id: 'backyard', name: 'バックヤード', image: () => img('backyard'), ambience: 'backstage',
    filter: (s) => (s.solved.meta ? 'brightness(1.5)' : 'brightness(1.15)'),
    hotspots: [
      { id: 'distro', rect: [35, 38, 14, 34], kind: 'look', label: '仮設分電盤', onClick: (c) => c.open('distro') },
      { id: 'trucklist', rect: [11, 28, 9, 14], kind: 'look', label: 'ケースのクリップボード', onClick: (c) => c.open('truckList') },
      { id: 'cable', rect: [30, 72, 22, 16], kind: 'use', label: '床に伸びた入力ケーブル', onClick: (c) => {
        if (c.s.flags['drumConnected']) { c.say('ドラムで延長した入力ケーブルが、分電盤につながっている。'); return; }
        if (c.held === 'drum') {
          sfx('pickup');
          setFlag('drumConnected');
          c.say('電源ドラムを噛ませると、入力ケーブルが分電盤まで届いた。盤のINPUTランプが点く。');
        } else c.say('発電車から来ている入力ケーブル。巻き取られていて、分電盤まで数メートル足りない。');
      } },
      { id: 'shutter', rect: [52, 6, 26, 56], kind: 'go', label: '搬入口シャッター', arrow: 'up', onClick: (c) => {
        if (c.s.solved.p6) c.go('dock');
        else { sfx('lock'); c.say('電動シャッター。操作盤のランプは消えている。'); }
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
        c.secret('chalk', '空の荷台の壁に、チョークで一行。「また、どこかの会場で」');
      } },
      { id: 'outside', rect: [76, 28, 20, 34], kind: 'look', label: '外', onClick: (c) => c.say('搬出口の外は駐車場。フェンスの向こうに道路。ここから出るのは、さすがにまずい。') },
      back('backyard', 'バックヤードへ戻る'),
    ],
  },
  outside: {
    id: 'outside', name: '会場の外', image: () => img('outside'), ambience: 'outside', hotspots: [],
  },
};
