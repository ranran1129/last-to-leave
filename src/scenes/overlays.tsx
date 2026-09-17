import type { GameState, SceneId } from '../game/types';
import { CART_ORDER, STANDS, GLOW_MARKS, MERCH_SOLDOUT, MERCH_COLS, PLAYER_SEAT } from '../game/data';
import { standImg, HEIGHT_SCALE, STAND_AR } from '../closeups/docs';
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
  rot?: number; brightness?: number; shadow?: number;
} = {}) => (
  <g transform={`translate(${x} ${y}) rotate(${o.rot ?? 0})`}>
    <ellipse cx={0} cy={w * 0.02} rx={w * 0.38} ry={w * 0.055} fill="#000" opacity={o.shadow ?? 0.4} filter="url(#softShadow)" />
    <image href={img(name)} x={-w / 2} y={-w} width={w} height={w} preserveAspectRatio="xMidYMax meet"
      style={{ filter: `brightness(${o.brightness ?? 0.6}) saturate(0.85) contrast(1.05)` }} />
  </g>
);

function ArenaOv({ s }: { s: GameState }) {
  return (
    <g>
      {/* 係員が置いていったバインダー（椅子の座面の上） */}
      {prop('prop_clipboard', 560, 600, 62, { rot: -9, brightness: 0.62, shadow: 0.3 })}
      {!s.items.includes('silvertape') && prop('prop_tape', 720, 700, 96, { rot: 4, brightness: 0.95, shadow: 0.18 })}
    </g>
  );
}

function ArenaBackOv({ s }: { s: GameState }) {
  return (
    <g>
      {blockSign(437, 404, 54, '扉4', 0)}
      <g transform="translate(497,487)">
        <rect x="-13" y="-17" width="26" height="34" rx="3" fill="#20252b" stroke="#5b636c" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="4.5" fill={s.solved.p1 ? '#2ee06a' : '#c8382c'} />
      </g>
      {s.solved.p1 && <rect x="404" y="452" width="16" height="96" fill="#05070a" opacity="0.9" />}
    </g>
  );
}

function ArenaDoorOv({ s }: { s: GameState }) {
  return (
    <g>
      {/* 壁の制御箱（写真の箱にぴったり重ねる） */}
      <g transform="translate(838,420)">
        <rect x="-62" y="-95" width="124" height="190" rx="3" fill="#2f353c" opacity="0.96" />
        <rect x="-62" y="-95" width="124" height="190" rx="3" fill="none" stroke="#767e87" strokeWidth="2" />
        <rect x="-48" y="-80" width="96" height="62" rx="2" fill="#10151a" />
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={-45 + c * 24} y={-76 + r * 20} width="19" height="16" rx="2" fill="#3c444d" />
        )))}
        <circle cx="0" cy="28" r="8" fill={s.solved.p1 ? '#2ee06a' : '#c8382c'} />
        <rect x="-38" y="48" width="76" height="26" rx="13" fill="#39414a" />
      </g>
      {blockSign(838, 246, 60, '扉4')}
      {s.solved.p1 && (
        <g>
          <rect x="300" y="216" width="118" height="556" fill="#05070a" opacity="0.94" />
          <rect x="300" y="216" width="16" height="556" fill="#1b2026" />
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
  // ガラス扉の上に掲げられた出口番号（写真の扉列に合わせる）
  const gates = [
    { n: 1, x: 250 }, { n: 2, x: 377 }, { n: 3, x: 504 },
    { n: 4, x: 631, y: 2 }, { n: 5, x: 758, y: 4 }, { n: 6, x: 882, y: 6 },
  ];
  return (
    <g>
      {gates.map((g) => blockSign(g.x, 366 + (g.y ?? 0), 30, String(g.n)))}
      {s.solved.meta && <rect x="0" y="0" width="1600" height="900" fill="#ffe9c0" opacity="0.05" />}
    </g>
  );
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
  // 立て看板（白いボード）に貼られた商品一覧。写真のボードの傾きに合わせる
  const bw = 196, bh = 470, bx = 104, by = 304;
  const cw = bw / MERCH_COLS;
  const chh = bh / 4;
  return (
    <g>
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

function StockOv({ s }: { s: GameState }) {
  if (s.items.includes('drum')) return null;
  return prop('prop_drum', 628, 792, 226, { brightness: 0.78, shadow: 0.4 });
}

function FlowersOv({ s }: { s: GameState }) {
  return (
    <g>
      {CART_ORDER.map((id, i) => {
        const st = STANDS.find((x) => x.id === id)!;
        const k = HEIGHT_SCALE[st.height];
        const h = 430 * k, w = h * STAND_AR[id];
        const cx = 120 + i * 118;
        const baseY = 800;
        return (
          <g key={id}>
            <ellipse cx={cx} cy={baseY - 4} rx={w * 0.42} ry="12" fill="#000" opacity="0.45" />
            <image href={standImg(id)} x={cx - w / 2} y={baseY - h} width={w} height={h} preserveAspectRatio="xMidYMax meet"
              style={{ filter: 'brightness(0.34) saturate(0.7) contrast(1.05)' }} />
          </g>
        );
      })}
      <g transform="translate(905,330)">
        <rect x="-26" y="-32" width="52" height="64" rx="4" fill="#3a414a" stroke="#606973" strokeWidth="2" />
        <rect x="-18" y="-24" width="36" height="26" fill="#12161a" />
        <circle cx="0" cy="16" r="6" fill={s.solved.p3 ? '#2ee06a' : '#c8382c'} />
      </g>
      {s.solved.p3 && <rect x="655" y="185" width="26" height="300" fill="#05070a" opacity="0.9" />}
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
      {prop('prop_clipboard', 232, 330, 96, { rot: 4, brightness: 0.5 })}
      {s.flags['drumConnected'] && (
        <g>
          <path d="M520 780 q120 -40 190 -70 q40 -18 30 -60" stroke="#e5762a" strokeWidth="9" fill="none" opacity="0.9" />
          <circle cx="742" cy="640" r="8" fill="#2ee06a" />
        </g>
      )}
      {s.solved.p6 && (
        <g>
          <rect x="835" y="60" width="465" height="120" fill="#20242a" />
          <rect x="835" y="180" width="465" height="420" fill="#0a0c0f" opacity="0.92" />
          <rect x="835" y="180" width="465" height="16" fill="#3a4048" />
          <ellipse cx="1067" cy="620" rx="230" ry="40" fill="#ffd9a0" opacity="0.18" />
        </g>
      )}
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
