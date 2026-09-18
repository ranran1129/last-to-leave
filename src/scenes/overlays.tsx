import type { GameState, SceneId } from '../game/types';
import { GLOW_MARKS, MERCH_SOLDOUT, MERCH_COLS, PLAYER_SEAT } from '../game/data';
import { img } from '../game/assets';

/**
 * 写真の上に重ねるレイヤー。小道具は生成した実写素材を切り抜いて置き、
 * 影とトーンを合わせてから配置する（イラストを描かない）。
 * 座標はすべて 1600×900 の写真座標。
 */
export function SceneOverlay({ id, s }: { id: SceneId; s: GameState }) {
  return (
    <svg className="overlay-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden>
      <defs>
        <filter id="propShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#000" floodOpacity="0.55" />
        </filter>
        <filter id="softShadow" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      {id === 'arena' && <ArenaOv s={s} />}
      {id === 'arenaback' && <ArenaBackOv s={s} />}
      {id === 'arenadoor' && <ArenaDoorOv s={s} />}
      {id === 'stagefront' && <StageFrontOv s={s} />}
      {id === 'merch' && <MerchOv s={s} />}
      {id === 'stock' && <StockOv s={s} />}
      {id === 'flowers' && <FlowersOv s={s} />}
      {id === 'stage' && <StageOv s={s} />}
      {id === 'backyard' && <BackyardOv s={s} />}
      {id === 'dock' && <DockOv s={s} />}
      {id === 'gate' && <GateOv s={s} />}
      {id === 'lobby' && <LobbyOv s={s} />}
      {id === 'foh' && <FohOv s={s} />}
    </svg>
  );
}

/** 現場で使う紙のブロック標識（ラミネートしてポールに貼ったもの） */
const blockSign = (x: number, y: number, w: number, label: string, rot = 0) => (
  <g key={`sign-${label}-${x}`} transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#propShadow)">
    <rect x={-w / 2} y={0} width={w} height={w * 0.66} rx="2" fill="#f4f2ec" />
    <rect x={-w / 2} y={0} width={w} height={w * 0.66} rx="2" fill="none" stroke="#b9b3a4" strokeWidth="1" />
    <text x={0} y={w * 0.47} textAnchor="middle" fontSize={w * 0.42} fill="#23262b" fontFamily="var(--sans)" fontWeight="700">{label}</text>
  </g>
);

/** 切り抜いた実写小道具を、影と露出を合わせて置く */
const prop = (name: Parameters<typeof img>[0], x: number, y: number, w: number, o: {
  rot?: number; brightness?: number; shadow?: number; saturate?: number;
} = {}) => (
  <g transform={`translate(${x} ${y}) rotate(${o.rot ?? 0})`}>
    <ellipse cx={0} cy={w * 0.02} rx={w * 0.38} ry={w * 0.055} fill="#000" opacity={o.shadow ?? 0.4} filter="url(#softShadow)" />
    <image href={img(name)} x={-w / 2} y={-w} width={w} height={w} preserveAspectRatio="xMidYMax meet"
      style={{ filter: `brightness(${o.brightness ?? 0.6}) saturate(${o.saturate ?? 0.85}) contrast(1.05)` }} />
  </g>
);

// 手掛かり（椅子の上のバインダー・床の銀テープ）は写真そのものに写っているので、重ね描きはしない
function ArenaOv(_: { s: GameState }) { return null; }

function ArenaBackOv({ s }: { s: GameState }) {
  // 扉横の制御盤のランプだけ。ほかは写真のまま
  return (
    <g>
      <circle cx="518" cy="500" r="4" fill={s.solved.p1 ? '#2ee06a' : '#c8382c'} opacity="0.95" />
      {s.solved.p1 && <rect x="487" y="478" width="14" height="56" fill="#05070a" opacity="0.85" />}
    </g>
  );
}

function ArenaDoorOv({ s }: { s: GameState }) {
  // 制御盤は写真に写っているので、状態を示すランプだけを重ねる
  return (
    <g>
      <circle cx="757" cy="242" r="7" fill={s.solved.p1 ? '#2ee06a' : '#e0452f'} opacity="0.9" />
      {s.solved.p1 && (
        <g>
          <rect x="228" y="212" width="170" height="580" fill="#05070a" opacity="0.92" />
          <rect x="228" y="212" width="14" height="580" fill="#1b2026" />
        </g>
      )}
    </g>
  );
}

function StageFrontOv({ s }: { s: GameState }) {
  const spots = GLOW_MARKS.map((m) => ({ x: 800 + m.side * 108 * (1 - (m.depth - 1) * 0.12), y: 300 + (3 - m.depth) * 34 }));
  return (
    <g>
      {/* クルーが貼っている色テープ（ケースの角） */}
      <rect x="62" y="346" width="236" height="13" fill="#2f6fd6" opacity="0.9" />
      <rect x="688" y="346" width="150" height="12" fill="#e6c229" opacity="0.9" />
      <rect x="1278" y="396" width="118" height="12" fill="#d63b2f" opacity="0.9" />
      <rect x="1424" y="396" width="94" height="12" fill="#d63b2f" opacity="0.9" />
      {s.solved.p5 && spots.map((p, i) => (
        <g key={i}>
          <ellipse cx={p.x} cy={p.y + 120} rx="86" ry="26" fill="#ffe9c0" opacity="0.28" />
          <path d={`M${p.x - 26} 60 L${p.x + 26} 60 L${p.x + 86} ${p.y + 120} L${p.x - 86} ${p.y + 120} z`} fill="#ffe9c0" opacity="0.07" />
        </g>
      ))}
    </g>
  );
}

function FohOv({ s }: { s: GameState }) {
  return (
    <g>
      <circle cx="300" cy="640" r="6" fill={s.solved.p4 ? '#2ee06a' : '#c8a032'} opacity="0.9" />
      <circle cx="1180" cy="640" r="6" fill={s.solved.p5 ? '#2ee06a' : s.solved.p6 ? '#c8a032' : '#8a3a30'} opacity="0.9" />
    </g>
  );
}

function LobbyOv({ s }: { s: GameState }) {
  return s.solved.meta ? <rect x="0" y="0" width="1600" height="900" fill="#ffe9c0" opacity="0.05" /> : null;
}

function GateOv({ s }: { s: GameState }) {
  return (
    <g>
      <rect x="985" y="150" width="145" height="95" fill="#05070a" opacity="0.9" />
      <text x="1057" y="200" textAnchor="middle" fontSize="26" className="mono" fill={s.solved.meta ? '#39e27f' : '#ff5a3c'}>
        {s.solved.meta ? 'OPEN' : 'CLOSED'}
      </text>
      <text x="1057" y="228" textAnchor="middle" fontSize="16" fill={s.solved.meta ? '#39e27f' : '#ff5a3c'}>
        {s.solved.meta ? '出口6 開放' : '閉館処理中'}
      </text>
    </g>
  );
}

function MerchOv({ s }: { s: GameState }) {
  // 商品ボード・付箋・扉のメモは写真に写っている。錠だけ切り抜きを扉の掛け金に置く
  return (
    <g>
      {prop('prop_lock', 1035, 430, 62, { rot: s.solved.p2 ? 18 : 0, brightness: 0.62, shadow: 0.1, saturate: 0.2 })}
    </g>
  );
}

function MerchOvOld({ s }: { s: GameState }) {
  const bw = 196, bh = 470, bx = 104, by = 304;
  const cw = bw / MERCH_COLS;
  const chh = bh / 4;
  return (
    <g style={{ display: 'none' }}>
      <g transform={`translate(${bx} ${by}) skewY(2.2)`} opacity="0.94">
        <rect x="0" y="0" width={bw} height={bh} fill="#f6f4ee" />
        <rect x="0" y="0" width={bw} height="34" fill="#dfdacf" />
        <rect x={bw * 0.18} y="12" width={bw * 0.64} height="9" rx="2" fill="#6d6a63" />
        {Array.from({ length: 12 }).map((_, i) => {
          const x = (i % MERCH_COLS) * cw, y = 34 + Math.floor(i / MERCH_COLS) * chh;
          return (
            <g key={i}>
              <rect x={x + 2} y={y + 2} width={cw - 4} height={chh - 4} fill="#fff" stroke="#d3cec2" strokeWidth="0.8" />
              <rect x={x + 8} y={y + 8} width={cw - 16} height={chh * 0.42} fill="#e8e4d9" />
              {[0, 1].map((k) => (
                <rect key={k} x={x + 8} y={y + chh * 0.56 + k * 9} width={(cw - 16) * (k ? 0.6 : 0.85)} height="4" rx="1.5" fill="#8d897f" />
              ))}
            </g>
          );
        })}
        {MERCH_SOLDOUT.map((n) => {
          const cx = ((n - 1) % MERCH_COLS) * cw + cw / 2, cy = 34 + Math.floor((n - 1) / MERCH_COLS) * chh + chh * 0.42;
          return (
            <g key={n} transform={`rotate(-8 ${cx} ${cy})`}>
              <circle cx={cx} cy={cy} r={cw * 0.25} fill="#cf3b2c" />
              <circle cx={cx} cy={cy} r={cw * 0.25} fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.8" />
            </g>
          );
        })}
      </g>
      {/* 会計台に残された付箋つきのバインダー */}
      {prop('prop_clipboard', 880, 800, 112, { rot: 6, brightness: 0.72, shadow: 0.3 })}
      {/* ストック室の扉に貼られたメモ */}
      <g transform="translate(958,332) rotate(-2)" filter="url(#propShadow)">
        <rect x="0" y="0" width="50" height="64" fill="#fdfcf7" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x="7" y={13 + i * 12} width={36 - i * 5} height="3" fill="#5a6270" />)}
      </g>
      {/* 扉の掛け金にかかった方向錠 */}
      {prop('prop_lock', 986, 500, 86, { rot: s.solved.p2 ? 16 : 0, brightness: 0.62, shadow: 0.18 })}
      {s.solved.p2 && <rect x="1010" y="360" width="8" height="130" fill="#05070a" opacity="0.8" />}
    </g>
  );
}

// 電源ドラムは写真に写っており、取ると「持ち去ったあと」の写真に切り替わる
function StockOv(_: { s: GameState }) { return null; }

function FlowersOv({ s }: { s: GameState }) {
  // 祝花も壁のボックスも写真に写っている。状態ランプと、開いた扉の暗がりだけを足す
  return (
    <g>
      <circle cx="916" cy="500" r="5" fill={s.solved.p3 ? '#2ee06a' : '#c8382c'} opacity="0.95" />
    </g>
  );
}

function StageOv({ s }: { s: GameState }) {
  if (!s.solved.p8) return null;
  return (
    <g>
      {GLOW_MARKS.map((m, i) => {
        const x = 800 - m.side * 132 * (0.7 + (m.depth - 1) * 0.16);
        const y = 640 + (m.depth - 1) * 78;
        return (
          <g key={i}>
            {s.solved.p5 && <ellipse cx={x} cy={y} rx="118" ry="40" fill="#ffe9c0" opacity="0.3" />}
            <rect x={x - 16} y={y - 4} width="32" height="9" fill="#b8ffd8" opacity={s.solved.p5 ? 0.5 : 0.85} />
          </g>
        );
      })}
    </g>
  );
}

function BackyardOv({ s }: { s: GameState }) {
  return (
    <g>
      {/* クリップボード・電源ドラム・開いたシャッターはすべて写真側。INPUTランプだけ重ねる */}
      {s.flags['drumConnected'] && <circle cx="688" cy="418" r="6" fill="#2ee06a" opacity="0.95" />}
    </g>
  );
}

function DockOv({ s }: { s: GameState }) {
  return (
    <g>
      <rect x="120" y="455" width="92" height="66" fill={s.solved.meta ? '#16351f' : '#0c1014'} />
      <text x="166" y="497" textAnchor="middle" fontSize="20" className="mono" fill={s.solved.meta ? '#4ef08f' : '#7b8590'}>
        {s.solved.meta ? 'GUIDE' : 'LOCK'}
      </text>
      {s.solved.meta && <rect x="0" y="0" width="1600" height="900" fill="#ffe9c0" opacity="0.06" />}
    </g>
  );
}

export const PLAYER_BLOCK = PLAYER_SEAT.block;
