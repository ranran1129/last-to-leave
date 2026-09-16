import type { GameState, SceneId } from '../game/types';
import { CART_ORDER, STANDS, GLOW_MARKS, MERCH_SOLDOUT } from '../game/data';
import { standImg, HEIGHT_SCALE, STAND_AR } from '../closeups/docs';

/**
 * Photo-realistic scenes get their signage, lamps, paper and state changes from
 * this SVG layer so the same photograph can show several world states.
 */
export function SceneOverlay({ id, s }: { id: SceneId; s: GameState }) {
  return (
    <svg className="overlay-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden>
      {id === 'arena' && <ArenaOv s={s} />}
      {id === 'arenaback' && <ArenaBackOv s={s} />}
      {id === 'arenadoor' && <ArenaDoorOv s={s} />}
      {id === 'stagefront' && <StageFrontOv s={s} />}
      {id === 'merch' && <MerchOv s={s} />}
      {id === 'flowers' && <FlowersOv s={s} />}
      {id === 'corridor' && <CorridorOv s={s} />}
      {id === 'stage' && <StageOv s={s} />}
      {id === 'backyard' && <BackyardOv s={s} />}
      {id === 'dock' && <DockOv s={s} />}
      {id === 'gate' && <GateOv s={s} />}
      {id === 'lobby' && <LobbyOv s={s} />}
      {id === 'foh' && <FohOv s={s} />}
    </svg>
  );
}

const sign = (x: number, y: number, t: string, w = 74) => (
  <g>
    <rect x={x - w / 2} y={y} width={w} height="34" rx="3" fill="#14171b" stroke="#4a525c" strokeWidth="1.5" opacity="0.95" />
    <text x={x} y={y + 25} textAnchor="middle" fontSize="22" fill="#d9dde2" fontFamily="var(--sans)">{t}</text>
  </g>
);

function ArenaOv({ s }: { s: GameState }) {
  return (
    <g>
      {/* block signs hanging over the aisle */}
      {sign(300, 470, 'B3')}
      {sign(800, 470, 'C3')}
      {sign(1300, 470, 'D3')}
      {[300, 800, 1300].map((x) => <line key={x} x1={x} y1="440" x2={x} y2="470" stroke="#3a4048" strokeWidth="3" />)}
      {/* staff chair with the announcement binder */}
      <g transform="translate(168,648) rotate(-7) scale(0.72)">
        <rect x="-46" y="-60" width="92" height="120" rx="4" fill="#c8bda0" stroke="#7e7660" strokeWidth="2" />
        <rect x="-40" y="-52" width="80" height="104" fill="#f3efe3" />
        <rect x="-26" y="-64" width="52" height="14" rx="3" fill="#9aa0a6" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={-30} y={-34 + i * 16} width={60 - i * 7} height="4" fill="#9aa4b5" />)}
      </g>
      {!s.items.includes('silvertape') && (
        <g opacity="0.9">
          <path d="M760 790 q40 -16 84 4 q34 16 70 -6" stroke="#d9dee3" strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function ArenaBackOv({ s }: { s: GameState }) {
  return (
    <g>
      <g transform="translate(470,430)">
        <rect x="-26" y="-22" width="52" height="44" rx="4" fill="#2b3037" stroke="#575f68" strokeWidth="2" />
        <circle cx="0" cy="0" r="7" fill={s.solved.p1 ? '#2ee06a' : '#c8382c'} />
      </g>
      {sign(470, 330, '扉 4', 90)}
      {s.solved.p1 && <rect x="360" y="360" width="34" height="300" fill="#0b0e11" opacity="0.85" />}
    </g>
  );
}

function ArenaDoorOv({ s }: { s: GameState }) {
  return (
    <g>
      {/* the wall box gets a face so it reads as a device */}
      <g transform="translate(830,455)">
        <rect x="-58" y="-88" width="116" height="176" rx="4" fill="#2b3037" stroke="#656d76" strokeWidth="2" opacity="0.9" />
        <rect x="-44" y="-72" width="88" height="66" rx="3" fill="#0f1317" />
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
          <rect key={`${r}${c}`} x={-42 + c * 22} y={-70 + r * 21} width="18" height="17" rx="2" fill="#39414a" />
        )))}
        <circle cx="0" cy="26" r="9" fill={s.solved.p1 ? '#2ee06a' : '#c8382c'} />
        <rect x="-36" y="46" width="72" height="26" rx="13" fill="#3a434d" />
      </g>
      {sign(830, 330, '扉 4', 90)}
      {s.solved.p1 && (
        <g>
          <rect x="300" y="215" width="120" height="560" fill="#05070a" opacity="0.92" />
          <rect x="300" y="215" width="18" height="560" fill="#1b2026" />
        </g>
      )}
    </g>
  );
}

function StageFrontOv({ s }: { s: GameState }) {
  const spots = GLOW_MARKS.map((m) => ({ x: 800 + m.side * 108 * (1 - (m.depth - 1) * 0.12), y: 300 + (3 - m.depth) * 34 }));
  return (
    <g>
      {/* colour tape on the cases (the same code the crew uses everywhere) */}
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
  return (
    <g>
      {[1, 2, 3, 4, 5, 6].map((g, i) => (
        <text key={g} x={508 + i * 88} y={352} textAnchor="middle" fontSize="20" fill="#cfd4da" opacity="0.85">{g}</text>
      ))}
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
        {s.solved.meta ? 'ゲート6' : '閉館処理中'}
      </text>
    </g>
  );
}

function MerchOv({ s }: { s: GameState }) {
  return (
    <g>
      {/* product board */}
      <g transform="translate(152,236)">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={(i % 3) * 82} y={Math.floor(i / 3) * 92} width="76" height="86" fill="#fbfaf6" stroke="#cfcabb" strokeWidth="1.5" opacity="0.9" />
        ))}
        {MERCH_SOLDOUT.map((n) => (
          <circle key={n} cx={((n - 1) % 3) * 82 + 38} cy={Math.floor((n - 1) / 3) * 92 + 43} r="22" fill="#d33a2c" opacity="0.85" />
        ))}
      </g>
      {/* memo + padlock on the stock door */}
      <g transform="translate(905,290) rotate(-3)">
        <rect x="0" y="0" width="86" height="104" fill="#fdfcf7" stroke="#d6d1c4" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x="10" y={20 + i * 18} width={66 - i * 9} height="5" fill="#5a6270" />)}
      </g>
      <g transform="translate(1035,490)">
        <rect x="-26" y="-6" width="52" height="42" rx="6" fill={s.solved.p2 ? '#3d4a3f' : '#5a626b'} stroke="#2b3138" strokeWidth="2" />
        <path d="M-14 -6 v-16 a14 14 0 0 1 28 0 v16" fill="none" stroke="#b9c0c8" strokeWidth="7"
          transform={s.solved.p2 ? 'translate(10,-12) rotate(20)' : ''} />
      </g>
    </g>
  );
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
            <image href={standImg(id)} x={cx - w / 2} y={baseY - h} width={w} height={h} preserveAspectRatio="xMidYMax meet"
              style={{ filter: 'brightness(0.5)', mixBlendMode: 'multiply' }} opacity="0.25" />
          </g>
        );
      })}
      {/* wall box beside the staff door */}
      <g transform="translate(905,330)">
        <rect x="-26" y="-32" width="52" height="64" rx="4" fill="#3a414a" stroke="#606973" strokeWidth="2" />
        <rect x="-18" y="-24" width="36" height="26" fill="#12161a" />
        <circle cx="0" cy="16" r="6" fill={s.solved.p3 ? '#2ee06a' : '#c8382c'} />
      </g>
      {s.solved.p3 && <rect x="655" y="185" width="26" height="300" fill="#05070a" opacity="0.9" />}
    </g>
  );
}

function CorridorOv({ s }: { s: GameState }) {
  return (
    <g>
      <g transform="translate(1085,300)">
        <rect x="-160" y="-110" width="320" height="230" fill="#f7f8f8" opacity="0.08" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={-150} y={-96 + i * 42} width={280 - (i % 2) * 60} height="7" rx="3" fill={i === 0 ? '#b3261e' : i === 4 ? '#b3261e' : '#1f2c55'} opacity="0.65" />
        ))}
      </g>
      <g transform="translate(875,395)">
        <rect x="-16" y="-38" width="34" height="88" fill="#f3efe3" opacity="0.9" />
        <rect x="-16" y="-38" width="34" height="10" fill="#9aa0a6" />
      </g>
      {s.solved.meta && <rect x="0" y="0" width="1600" height="900" fill="#fff4e0" opacity="0.06" />}
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
      {/* clipboards on the cases */}
      <g transform="translate(232,330)">
        <rect x="-32" y="-52" width="64" height="86" fill="#cdc7b6" opacity="0.8" />
        <rect x="-20" y="-58" width="40" height="12" rx="3" fill="#8a9097" opacity="0.85" />
        {[0, 1, 2].map((i) => <rect key={i} x={-24} y={-38 + i * 16} width={44 - i * 8} height="3" fill="#7b8189" opacity="0.7" />)}
      </g>
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
