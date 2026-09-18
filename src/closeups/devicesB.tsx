import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { img } from '../game/assets';
import { setScratch, solve } from '../game/engine';
import { say, setUI } from '../game/ui';
import { sfx } from '../audio/audio';
import { checkP4, checkP5, checkP6, checkMeta } from '../game/puzzles';
import {
  SOUND_INPUTS, SOUND_LIVE_INPUT, SOUND_OUTPUTS, SOUND_OUT_STATE, P4_OUTPUTS,
  GLOW_MARKS, sideLabel, BREAKERS, breakerLabel, P6_ANSWER, CHECK_DOTS, BLOCK_COLS, BLOCK_ROWS, STAGE_VIEW_COLS,
} from '../game/data';

// =====================================================================  P4 sound desk
export function SoundDesk() {
  const s = useGame((x) => x);
  const solved = !!s.solved.p4;
  const src = (s.scratch.p4src as string | null) ?? null;
  const outs = ((s.scratch.p4out as string[]) ?? []);
  const [result, setResult] = useState<string | null>(null);
  const [meter, setMeter] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setMeter(Math.random()), 180);
    return () => window.clearInterval(id);
  }, []);
  const apply = () => {
    if (solved) return;
    sfx('click');
    if (checkP4(src, outs)) {
      sfx('relay');
      window.setTimeout(() => sfx('pa'), 800);
      solve('p4');
      say('コンコースの方から、小さくチャイムが鳴った。録音された場内放送が流れはじめる。');
    } else if (src !== SOUND_LIVE_INPUT) {
      setResult('この入力には音が来ていません。メーターが振れている入力を選んでください。');
      sfx('error');
    } else if (outs.includes('BS-SR-1')) {
      setResult('搬入口 下手側 本線は断線しています。生きている回線に振り替えてください。');
      sfx('error');
    } else {
      setResult('客席・コンコース・搬入口の3か所そろっていません。搬入口はどの回線に振り替えられていた？');
      sfx('error');
    }
  };
  const W = 1200, H = 800;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="sound-desk" style={{ background: '#0e1216' }}>
      <image href={img('sounddesk')} x="0" y="0" width={W} height={H * 1.05} preserveAspectRatio="xMidYMid slice" style={{ filter: 'brightness(0.35) blur(1px)' }} />
      <rect x="30" y="24" width={W - 60} height={H - 48} rx="14" fill="rgba(10,14,18,0.9)" stroke="#39424c" strokeWidth="3" />
      <text x="60" y="70" fontSize="26" fill="#dfe3e8">場内放送　どこに流すかを決める</text>
      {/* 目的をはっきり出す */}
      <rect x="56" y="88" width={W - 112} height="46" rx="8" fill="#17222c" stroke="#2b3d4c" strokeWidth="2" />
      <text x="76" y="118" fontSize="18" fill="#9fd0f0">やること：音の来ている入力を選び、<tspan fill="#ffd07a">客席・コンコース・搬入口</tspan>の3か所へ流す</text>
      {/* inputs */}
      <text x="60" y="176" fontSize="19" fill="#a9b1b9">入力（音が来ている系統だけメーターが振れる）</text>
      {SOUND_INPUTS.map((ch, i) => {
        const live = ch === SOUND_LIVE_INPUT;
        const lv = live ? 0.25 + meter * 0.7 : 0.02;
        const x = 60 + i * 132;
        return (
          <g key={ch} className="tap" data-testid={`src-${ch}`} onClick={() => { if (!solved) { setScratch('p4src', src === ch ? null : ch); setResult(null); sfx('click'); } }}>
            <rect x={x} y={192} width={116} height={158} rx="8" fill={src === ch ? '#26405c' : '#1a1f26'} stroke={src === ch ? '#6fb6ff' : '#3a434d'} strokeWidth="2.5" />
            <text x={x + 58} y={218} textAnchor="middle" fontSize="19" fill="#cfd4da">入力{ch}</text>
            <rect x={x + 30} y={232} width={56} height={92} fill="#0c0f12" stroke="#2c343d" />
            <rect x={x + 32} y={324 - 88 * lv} width={52} height={88 * lv} fill={lv > 0.75 ? '#e0b64a' : '#4ad07a'} />
            <text x={x + 58} y={342} textAnchor="middle" fontSize="13" fill={live ? '#7fe0a6' : '#5a636d'}>{live ? '音あり' : '無音'}</text>
          </g>
        );
      })}
      {/* outputs */}
      <text x="60" y="404" fontSize="19" fill="#a9b1b9">流す先（押すと入／切）</text>
      {SOUND_OUTPUTS.map((o, i) => {
        const on = outs.includes(o.id);
        const st = SOUND_OUT_STATE[o.id];
        const x = 60 + (i % 4) * 280, y = 420 + Math.floor(i / 4) * 96;
        return (
          <g key={o.id} className="tap" data-testid={`out-${o.id}`} onClick={() => { if (!solved) { setScratch('p4out', on ? outs.filter((v) => v !== o.id) : [...outs, o.id]); setResult(null); sfx('click'); } }}>
            <rect x={x} y={y} width={258} height={78} rx="8" fill={on ? '#2a4034' : '#1a1f26'} stroke={on ? '#5fd694' : '#3a434d'} strokeWidth="2.5" />
            <circle cx={x + 26} cy={y + 30} r="10" fill={on ? '#5fd694' : '#39424c'} />
            <text x={x + 48} y={y + 37} fontSize="20" fill="#dfe3e8">{o.label}</text>
            <text x={x + 48} y={y + 63} fontSize="15" fill={st === '異常なし' ? '#7d858d' : '#ffa06a'}>{st}</text>
          </g>
        );
      })}
      <text x="60" y="648" fontSize="16" fill="#8d959d">※ 搬入口のスピーカーは上手側・下手側にあり、それぞれ「本線」と「予備」の2回線が来ている。</text>
      <g className="tap" onClick={apply} data-testid="sound-apply">
        <rect x={W - 330} y={H - 96} width="270" height="62" rx="31" fill={solved ? '#1f3a29' : '#2f3742'} stroke={solved ? '#2ee06a' : '#6f7884'} strokeWidth="3" />
        <text x={W - 195} y={H - 54} textAnchor="middle" fontSize="23" fill={solved ? '#8ff0b6' : '#e2e6ea'}>{solved ? '放送中' : '放送を流す'}</text>
      </g>
      {result && !solved && <text x="60" y={H - 54} fontSize="19" fill="#ff8a76">{result}</text>}
      {solved && <text x="60" y={H - 54} fontSize="19" fill="#8ff0b6">客席・コンコース・搬入口に放送が流れている</text>}
    </svg>
  );
}

// =====================================================================  P5 lighting desk
export function LightDesk() {
  const s = useGame((x) => x);
  const powered = !!s.solved.p6;
  const solved = !!s.solved.p5;
  const stored = ((s.scratch.p5 as string[]) ?? []);
  const cells = solved ? GLOW_MARKS.map((m) => `${m.side},${m.depth}`) : stored;
  const [msg, setMsg] = useState<string | null>(null);
  const cols = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const rows = [3, 2, 1]; // upstage → downstage (top → bottom on this plan)
  const W = 1200, H = 760, cw = 88, ch = 104, ox = 110, oy = 220;
  const toggle = (c: number, r: number) => {
    if (!powered || solved) return;
    const id = `${c},${r}`;
    sfx('click');
    setScratch('p5', cells.includes(id) ? cells.filter((x) => x !== id) : [...cells, id]);
    setMsg(null);
  };
  const go = () => {
    if (!powered || solved) return;
    if (cells.length !== 5) { setMsg('POSITION CHECK: 5点必要です'); sfx('error'); return; }
    if (checkP5(cells)) {
      sfx('relay'); window.setTimeout(() => sfx('power'), 400);
      solve('p5');
      say('ステージの5か所に、ぽっ、ぽっと明かりが落ちた。蓄光の印の上に、ちょうど。');
    } else { setMsg('POSITION CHECK: MISMATCH（前回ショーファイルの位置と一致しません）'); sfx('error'); }
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="light-desk" style={{ background: '#0e1216' }}>
      <image href={img('lightdesk')} x="0" y="0" width={W} height={H * 1.05} preserveAspectRatio="xMidYMid slice" style={{ filter: 'brightness(0.3) blur(1px)' }} />
      <rect x="30" y="24" width={W - 60} height={H - 48} rx="14" fill="rgba(10,14,18,0.92)" stroke="#39424c" strokeWidth="3" />
      <text x="60" y="70" fontSize="24" fill="#dfe3e8">Q48　暗転 → 明転</text>
      <text x="60" y="98" fontSize="15" fill="#8d959d">FOCUS DATA {solved ? 'STORED (5/5)' : `未設定 (${cells.length}/5)`}　／　RIG: {powered ? 'ONLINE' : 'NO RESPONSE'}</text>
      {!powered && <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="30" fill="#ff8a76">リグに電源が来ていない</text>}
      {powered && (
        <>
          <text x={W / 2} y={170} textAnchor="middle" fontSize="16" fill="#8d959d">舞台平面図（客席側から見た図）　奥 ↑</text>
          {rows.map((r, ri) => cols.map((c, ci) => {
            const id = `${c},${r}`;
            const on = cells.includes(id);
            const x = ox - 30 + ci * (cw + 2), y = oy + ri * (ch + 2);
            return (
              <g key={id} className="tap" onClick={() => toggle(c, r)} data-testid={`cell-${c}-${r}`}>
                <rect x={x} y={y} width={cw} height={ch} fill={on ? '#c9862a' : '#1a1f26'} stroke={on ? '#ffd07a' : '#333b44'} strokeWidth="2" />
                {on && <circle cx={x + cw / 2} cy={y + ch / 2} r="22" fill="#ffe6b0" opacity="0.5" />}
              </g>
            );
          }))}
          {cols.map((c, ci) => (
            <text key={c} x={ox - 30 + ci * (cw + 2) + cw / 2} y={oy - 14} textAnchor="middle" fontSize="20" fill="#9aa2aa" className="mono">{Math.abs(c)}</text>
          ))}
          {rows.map((r, ri) => (
            <text key={r} x={ox - 52} y={oy + ri * (ch + 2) + ch / 2 + 7} textAnchor="middle" fontSize="18" fill="#9aa2aa" className="mono">{r}</text>
          ))}
          <rect x={ox - 30} y={oy + 3 * (ch + 2) + 16} width={11 * (cw + 2) - 2} height="10" fill="#e8e6de" opacity="0.8" />
          <text x={W / 2} y={oy + 3 * (ch + 2) + 56} textAnchor="middle" fontSize="15" fill="#8d959d">↑ ステージ前端（客席側）</text>
          <g className="tap" onClick={go} data-testid="light-go">
            <rect x={W - 330} y={H - 96} width="270" height="60" rx="30" fill={solved ? '#1f3a29' : '#2f3742'} stroke={solved ? '#2ee06a' : '#6f7884'} strokeWidth="3" />
            <text x={W - 195} y={H - 56} textAnchor="middle" fontSize="22" fill={solved ? '#8ff0b6' : '#e2e6ea'}>{solved ? 'Q48 GO 済' : 'Q48 記録して GO'}</text>
          </g>
          {msg && <text x="60" y={H - 56} fontSize="18" fill="#ff8a76">{msg}</text>}
          {solved && <text x="60" y={H - 56} fontSize="18" fill="#8ff0b6">場内照明 制御 復旧</text>}
        </>
      )}
    </svg>
  );
}

// =====================================================================  P8 stage floor
/**
 * 舞台の床を真上から見た図。写真はテクスチャとして敷き、
 * 番号テープ・バミリ・蓄光マークはすべて同じ座標系で描くので、位置がずれない。
 * 向きは「舞台上に立って客席を向いた状態」＝上手が左、前端（客席側）が上。
 */
const FLOOR = {
  W: 1600, H: 900,
  tapeY: 214,          // 前端テープの中心
  step: 122,           // 番号の間隔
  cx: 800,             // 0番の位置
  rowY: [340, 520, 700] as const, // 奥行き1・2・3の中心
};
export const floorX = (side: number) => FLOOR.cx - side * FLOOR.step;
export const floorY = (depth: number) => FLOOR.rowY[depth - 1];

/** 背景として散っている普通のバミリ（蓄光ではない） */
const SPIKES: { side: number; depth: number; color: string; rot: number; dx: number; dy: number }[] = [
  { side: -4, depth: 1, color: '#d33a2c', rot: -6, dx: 18, dy: -26 },
  { side: -1, depth: 2, color: '#2f6fd6', rot: 4, dx: -22, dy: 30 },
  { side: 2, depth: 3, color: '#e6c229', rot: -3, dx: 26, dy: -18 },
  { side: 4, depth: 3, color: '#efefe9', rot: 8, dx: -16, dy: 24 },
  { side: -3, depth: 3, color: '#d33a2c', rot: 2, dx: 30, dy: 16 },
  { side: 3, depth: 1, color: '#2f6fd6', rot: -7, dx: -28, dy: 22 },
  { side: 0, depth: 1, color: '#e6c229', rot: 5, dx: 34, dy: 28 },
  { side: 5, depth: 2, color: '#d33a2c', rot: -2, dx: -20, dy: -24 },
  { side: -5, depth: 3, color: '#2f6fd6', rot: 6, dx: 22, dy: -20 },
  { side: 1, depth: 3, color: '#efefe9', rot: -4, dx: -30, dy: 26 },
  { side: -2, depth: 2, color: '#e6c229', rot: 3, dx: 26, dy: -28 },
];

export function StageFloor() {
  const s = useGame((x) => x);
  const glow = !!s.solved.p8;
  const { W, H, tapeY } = FLOOR;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="stage-floor">
      <defs>
        <filter id="glowBlur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16" /></filter>
        <radialGradient id="floorVig" cx="50%" cy="52%" r="72%">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
      </defs>
      <image href={img('floor_tex')} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice"
        style={{ filter: glow ? 'brightness(0.24) saturate(0.5) contrast(1.15)' : 'brightness(0.55) contrast(1.05)' }} />
      <rect x="0" y="0" width={W} height={H} fill="#070a0e" opacity={glow ? 0.42 : 0.2} />

      {/* 客席側（画面の上）は暗がり */}
      <rect x="0" y="0" width={W} height={tapeY - 44} fill="#04060a" opacity="0.96" />
      {/* 前端の白テープと番号 */}
      <rect x="40" y={tapeY - 12} width={W - 80} height="24" fill="#e9e6dc" opacity="0.92" />
      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((n) => (
        <text key={n} x={floorX(n)} y={tapeY + 7} textAnchor="middle" fontSize="19" fill="#23262b" fontWeight={n === 0 ? 700 : 400}>
          {sideLabel(n)}
        </text>
      ))}
      <text x="60" y={tapeY - 26} fontSize="17" fill="#9aa2aa">ステージ前端（客席側）</text>

      {/* 奥行きの列 */}
      {[1, 2, 3].map((d) => (
        <g key={d}>
          <line x1="40" y1={floorY(d)} x2={W - 40} y2={floorY(d)} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="2" strokeDasharray="14 18" />
          <rect x="44" y={floorY(d) - 17} width="40" height="34" fill="#e9e6dc" opacity="0.85" />
          <text x="64" y={floorY(d) + 7} textAnchor="middle" fontSize="19" fill="#23262b">{d}</text>
        </g>
      ))}
      <text x="44" y={floorY(3) + 62} fontSize="16" fill="#9aa2aa">奥行きの列（1＝前端に近い）</text>

      {/* 普通のバミリ */}
      {SPIKES.map((sp, i) => (
        <rect key={i} x={floorX(sp.side) + sp.dx - 17} y={floorY(sp.depth) + sp.dy - 6} width="34" height="12" rx="2"
          fill={sp.color} opacity={glow ? 0.35 : 0.8} transform={`rotate(${sp.rot} ${floorX(sp.side) + sp.dx} ${floorY(sp.depth) + sp.dy})`} />
      ))}

      {/* 蓄光マーク（ペンライトで光らせたときだけ） */}
      {glow && GLOW_MARKS.map((m, i) => {
        const x = floorX(m.side), y = floorY(m.depth);
        return (
          <g key={i} data-testid={`glow-${m.side}-${m.depth}`}>
            <circle cx={x} cy={y} r="62" fill="#9dffca" opacity="0.2" filter="url(#glowBlur)" />
            <path d={`M${x - 30} ${y - 16} h60 v12 h-24 v30 h-12 v-30 h-24 z`} fill="#c8ffe2" opacity="0.95" />
          </g>
        );
      })}

      <rect x="0" y="0" width={W} height={H} fill="url(#floorVig)" />
      {glow
        ? <text x={W / 2} y={100} textAnchor="middle" fontSize="23" fill="#b8ffd8">蓄光の印が5か所、浮かび上がっている</text>
        : <text x={W / 2} y={100} textAnchor="middle" fontSize="20" fill="#cfd4da">色とりどりのバミリ。前端のテープには番号が書いてある</text>}
    </svg>
  );
}

// =====================================================================  P6 distro
export function Distro() {
  const s = useGame((x) => x);
  const connected = !!s.flags['drumConnected'];
  const solved = !!s.solved.p6;
  const on = ((s.scratch.p6 as string[]) ?? []);
  const [tripped, setTripped] = useState(false);
  const labelOf = breakerLabel;
  const flip = (id: string) => {
    if (!connected || solved || tripped) return;
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    sfx('breaker');
    if (next.length > 3) {
      setTripped(true);
      window.setTimeout(() => { sfx('trip'); setScratch('p6', []); say('発電機のうなりが乱れ、ブレーカーがまとめて落ちた。同時に入れられるのは3系統までだ。'); }, 700);
      window.setTimeout(() => setTripped(false), 2200);
      setScratch('p6', next);
      return;
    }
    setScratch('p6', next);
    if (next.length === 3) {
      window.setTimeout(() => {
        if (checkP6(next)) {
          solve('p6');
          setUI({ cinematic: 'p6' });
        } else {
          // どれが「機材の外れた空の回路」だったのかを必ず伝える
          const bad = next.find((x) => !P6_ANSWER.includes(x));
          setTripped(true);
          sfx('trip');
          setScratch('p6', []);
          say(bad
            ? `ぶん、と低い音が鳴って、すぐにブレーカーが落ちた。〈${labelOf(bad)}〉は機材が運び出されたあとの、空の回路だったらしい。何もつながっていない線に送電したせいで保護装置が働いたようだ。`
            : 'しばらくして発電機の音が不規則に揺れ、ブレーカーが落ちた。');
          window.setTimeout(() => setTripped(false), 2000);
        }
      }, 1200);
    }
  };
  const W = 1200, H = 800;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="distro">
      <image href={img('distro')} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" style={{ filter: 'brightness(0.8)' }} />
      <rect x="150" y="120" width="900" height="560" fill="#4a525b" opacity="0.94" />
      <text x="180" y="166" fontSize="23" fill="#e4e8ec">仮設分電盤（撤収用の発電機につながっている）</text>
      <g>
        <text x="962" y="166" fontSize="16" fill="#cdd3d9" textAnchor="end">入力</text>
        <circle cx="990" cy="160" r="12" fill={connected ? '#2ee06a' : '#5a636d'} />
      </g>
      {/* 盤に貼られた注意書き＝「なぜ残っている機材を選ぶのか」の答え */}
      <g transform="translate(180,186)">
        <rect x="0" y="0" width="840" height="58" rx="5" fill="#e9e3cf" stroke="#b9b09a" strokeWidth="2" />
        <text x="16" y="25" fontSize="16" fill="#8a2b1e" fontWeight={700}>注意</text>
        <text x="62" y="25" fontSize="16" fill="#2b2b2b">機材を降ろしたあとの回路（線の先に何もつながっていない状態）に送電しないこと。</text>
        <text x="62" y="47" fontSize="16" fill="#2b2b2b">保護装置が働き、盤全体が落ちます。──いま館に残っている機材の系統だけ入れてください。</text>
      </g>
      {BREAKERS.map((b, i) => {
        const x = 186 + (i % 4) * 212, y = 268 + Math.floor(i / 4) * 186;
        const isOn = on.includes(b.id) && !tripped;
        return (
          <g key={b.id} className="tap" onClick={() => flip(b.id)} data-testid={`brk-${b.id}`}>
            <rect x={x} y={y} width={190} height={150} rx="6" fill="#2f353c" stroke="#1b1f24" strokeWidth="3" />
            <rect x={x + 69} y={y + 16} width={52} height={62} rx="5" fill="#d9dde2" />
            <rect x={x + 73} y={isOn ? y + 20 : y + 46} width={44} height={28} rx="4" fill={isOn ? '#d94b32' : '#6d757e'} />
            <text x={x + 95} y={y + 100} textAnchor="middle" fontSize="13" fill={isOn ? '#ffb4a3' : '#9aa2aa'}>{isOn ? '入' : '切'}</text>
            <text x={x + 95} y={b.sub ? y + 124 : y + 132} textAnchor="middle" fontSize="18" fill="#e4e8ec">{b.label}</text>
            {b.sub && <text x={x + 95} y={y + 145} textAnchor="middle" fontSize="16" fill="#c3cad1">（{b.sub}）</text>}
          </g>
        );
      })}
      <g transform="translate(1058,210) rotate(4)">
        <rect x="0" y="0" width="132" height="150" fill="#fff59a" />
        <text x="66" y="40" textAnchor="middle" fontSize="16" fill="#333" fontFamily="var(--hand)">発電機</text>
        <text x="66" y="66" textAnchor="middle" fontSize="16" fill="#333" fontFamily="var(--hand)">燃料わずか！</text>
        <text x="66" y="100" textAnchor="middle" fontSize="18" fill="#b3261e" fontFamily="var(--hand)">同時3系統まで</text>
        <text x="66" y="126" textAnchor="middle" fontSize="13" fill="#333" fontFamily="var(--hand)">超えると全部落ちます</text>
      </g>
      {!connected && <text x={W / 2} y={712} textAnchor="middle" fontSize="22" fill="#ff8a76">入力ケーブルが届いていない</text>}
      {connected && !solved && !tripped && <text x={W / 2} y={712} textAnchor="middle" fontSize="19" fill="#cdd3d9">入 {on.length} ／ 3系統</text>}
      {solved && <text x={W / 2} y={712} textAnchor="middle" fontSize="21" fill="#8ff0b6">送電中：照明リグ（上手）・音響/照明卓・搬入口シャッター</text>}
      {tripped && <text x={W / 2} y={748} textAnchor="middle" fontSize="20" fill="#ffb07a">遮断中…</text>}
    </svg>
  );
}

// =====================================================================  META dock panel
export function DockPanel() {
  const s = useGame((x) => x);
  const ready = !!s.solved.p4 && !!s.solved.p5 && !!s.solved.p6;
  const solved = !!s.solved.meta;
  const [block, setBlock] = useState<string | null>((s.scratch.metaBlock as string) ?? null);
  const [door, setDoor] = useState<string | null>((s.scratch.metaDoor as string) ?? null);
  const [gate, setGate] = useState<number | null>((s.scratch.metaGate as number) ?? null);
  const [msg, setMsg] = useState<string | null>(null);
  const W = 1200, H = 800;
  const run = () => {
    if (solved) return;
    if (checkMeta(block, door, gate)) {
      solve('meta');
      setUI({ cinematic: 'meta' });
      say('制御盤が、ゆっくりと息を吹き返していく。');
    } else { setMsg('この組み合わせでは誘導経路を作れません（ブロック・扉・出口をもう一度確認してください）'); sfx('error'); }
  };
  const save = (k: string, v: unknown) => setScratch(k, v);

  if (!ready) {
    const li = (okv: boolean, t: string) => (
      <>
        <tspan fill={okv ? '#7fe0a6' : '#ff8a76'}>{okv ? '✓ ' : '✗ '}</tspan><tspan fill="#cfd4da">{t}</tspan>
      </>
    );
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="dock-panel">
        <image href={img('dock')} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" style={{ filter: 'brightness(0.4)' }} />
        <rect x="120" y="120" width={W - 240} height={H - 240} rx="12" fill="#0d1116" stroke="#39424c" strokeWidth="4" />
        <text x="170" y="196" fontSize="26" fill="#dfe3e8">館内制御 ─ 閉館シーケンス 実行中</text>
        <text x="170" y="250" fontSize="19" fill="#8d959d">「残留者対応モード」起動条件</text>
        <text x="190" y="320" fontSize="22">{li(!!s.solved.p6, '① 搬入口 シャッター電源')}</text>
        <text x="190" y="380" fontSize="22">{li(!!s.solved.p5, '② 場内照明リグ 応答')}</text>
        <text x="190" y="440" fontSize="22">{li(!!s.solved.p4, '③ 場内放送 回線（客席・コンコース・搬入口）')}</text>
        <text x="170" y="540" fontSize="17" fill="#6f7883">条件がそろうと、ブロックの指定ができます。</text>
      </svg>
    );
  }

  // 舞台側から見た図：上手（F・E）が左、STAGE は下
  const cw = 118, ch = 62, gap = 6, ox = 262, oy = 226;
  const gridW = STAGE_VIEW_COLS.length * (cw + gap) - gap;
  const gridH = BLOCK_ROWS.length * (ch + gap) - gap;
  const colX = (c: string) => ox + STAGE_VIEW_COLS.indexOf(c as never) * (cw + gap);
  const rowY = (r: number) => oy + (BLOCK_ROWS.length - r) * (ch + gap);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="dock-panel">
      <rect x="0" y="0" width={W} height={H} fill="#0d1116" />
      <text x="60" y="58" fontSize="24" fill="#dfe3e8">残留者対応モード　誘導設定</text>
      <text x="60" y="86" fontSize="16" fill="#8d959d">図面：舞台側から　／　● ＝ 退場確認の記録</text>
      {/* gates */}
      {[1, 2, 3, 4, 5, 6].map((g, i) => (
        <g key={g} className="tap" data-testid={`gate-${g}`} onClick={() => { setGate(g); save('metaGate', g); sfx('click'); }}>
          <rect x={ox + i * (gridW / 6)} y={118} width={gridW / 6 - 10} height={50} rx="6" fill={gate === g ? '#26405c' : '#1a1f26'} stroke={gate === g ? '#6fb6ff' : '#3a434d'} strokeWidth="2.5" />
          <text x={ox + i * (gridW / 6) + (gridW / 6 - 10) / 2} y={150} textAnchor="middle" fontSize="18" fill="#cfd4da">出口{g}</text>
        </g>
      ))}
      <text x={ox - 16} y={150} textAnchor="end" fontSize="15" fill="#7d858d">コンコース</text>
      {/* doors */}
      {([['TL', ox - 74, oy - 6], ['TR', ox + gridW + 12, oy - 6], ['BL', ox - 74, oy + gridH - 70], ['BR', ox + gridW + 12, oy + gridH - 70]] as const).map(([d, x, y]) => (
        <g key={d} className="tap" data-testid={`door-${d}`} onClick={() => { setDoor(d); save('metaDoor', d); sfx('click'); }}>
          <rect x={x} y={y} width={60} height={76} rx="4" fill={door === d ? '#26405c' : '#1a1f26'} stroke={door === d ? '#6fb6ff' : '#3a434d'} strokeWidth="2.5" />
          <path d={`M${x + 11} ${y + 60} l0 -44 l38 -8 l0 60 z`} fill="none" stroke="#7d858d" strokeWidth="2" />
        </g>
      ))}
      <text x={ox - 44} y={oy + gridH + 26} textAnchor="middle" fontSize="14" fill="#7d858d">客席扉</text>
      {/* blocks */}
      {BLOCK_COLS.map((c) => BLOCK_ROWS.map((r) => {
        const id = `${c}${r}`;
        const sel = block === id;
        return (
          <g key={id} className="tap" data-testid={`mblk-${id}`} onClick={() => { setBlock(id); save('metaBlock', id); setMsg(null); sfx('click'); }}>
            <rect x={colX(c)} y={rowY(r)} width={cw} height={ch} rx="4" fill={sel ? '#5c3f14' : '#1a1f26'} stroke={sel ? '#ffd07a' : '#3a434d'} strokeWidth="2.5" />
            {Array.from({ length: CHECK_DOTS[id] }).map((_, i) => (
              <circle key={i} cx={colX(c) + cw / 2 + (i - (CHECK_DOTS[id] - 1) / 2) * 22} cy={rowY(r) + ch / 2} r="8" fill="#5fd694" opacity="0.9" />
            ))}
          </g>
        );
      }))}
      <rect x={ox + gridW * 0.2} y={oy + gridH + 12} width={gridW * 0.6} height="42" fill="#3a4048" />
      <text x={ox + gridW / 2} y={oy + gridH + 41} textAnchor="middle" fontSize="20" fill="#cfd4da" letterSpacing="6">STAGE</text>
      {/* readout */}
      <text x="60" y={H - 150} fontSize="18" fill="#a9b1b9">
        残っている人のブロック：<tspan fill="#ffd07a">{block ? '指定あり' : '未指定'}</tspan>
        通ってもらう客席扉：<tspan fill="#ffd07a">{door ? '指定あり' : '未指定'}</tspan>
        退場する出口：<tspan fill="#ffd07a">{gate ? `出口${gate}` : '未指定'}</tspan>
      </text>
      <g className="tap" onClick={run} data-testid="meta-run">
        <rect x={W - 360} y={H - 120} width="300" height="64" rx="32" fill={solved ? '#1f3a29' : '#2f3742'} stroke={solved ? '#2ee06a' : '#6f7884'} strokeWidth="3" />
        <text x={W - 210} y={H - 78} textAnchor="middle" fontSize="23" fill={solved ? '#8ff0b6' : '#e2e6ea'}>{solved ? '誘導中' : '誘導開始'}</text>
      </g>
      {msg && !solved && <text x="60" y={H - 76} fontSize="17" fill="#ff8a76">{msg}</text>}
      {solved && <text x="60" y={H - 76} fontSize="17" fill="#8ff0b6">誘導灯と照明を順番に点灯　→　6番出口を解錠</text>}
    </svg>
  );
}
