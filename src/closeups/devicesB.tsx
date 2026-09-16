import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { img } from '../game/assets';
import { setScratch, solve } from '../game/engine';
import { say, setUI } from '../game/ui';
import { sfx } from '../audio/audio';
import { checkP4, checkP5, checkP6, checkMeta } from '../game/puzzles';
import {
  SOUND_INPUTS, SOUND_LIVE_INPUT, SOUND_OUTPUTS, SOUND_OUT_STATE, P4_OUTPUTS,
  GLOW_MARKS, sideLabel, BREAKERS, CHECK_DOTS, BLOCK_COLS, BLOCK_ROWS, STAGE_VIEW_COLS,
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
      say('ロビーの方から、小さくチャイムが鳴った。録音された場内放送が流れはじめる。');
    } else if (src !== SOUND_LIVE_INPUT) {
      setResult('選択中の入力に信号がありません（NO SIGNAL）');
      sfx('error');
    } else {
      setResult('一部の系統に信号が届いていません（客席・ロビー・搬入口を確認）');
      sfx('error');
    }
  };
  const W = 1200, H = 760;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="sound-desk" style={{ background: '#0e1216' }}>
      <image href={img('sounddesk')} x="0" y="0" width={W} height={H * 1.05} preserveAspectRatio="xMidYMid slice" style={{ filter: 'brightness(0.35) blur(1px)' }} />
      <rect x="30" y="24" width={W - 60} height={H - 48} rx="14" fill="rgba(10,14,18,0.9)" stroke="#39424c" strokeWidth="3" />
      <text x="60" y="70" fontSize="24" fill="#dfe3e8">場内放送 ルーティング</text>
      <text x="60" y="98" fontSize="15" fill="#8d959d">PA ROUTING / HOUSE ANNOUNCE</text>
      {/* inputs */}
      <text x="60" y="150" fontSize="17" fill="#a9b1b9">入力</text>
      {SOUND_INPUTS.map((ch, i) => {
        const live = ch === SOUND_LIVE_INPUT;
        const lv = live ? 0.25 + meter * 0.7 : 0.02;
        const x = 60 + i * 132;
        return (
          <g key={ch} className="tap" data-testid={`src-${ch}`} onClick={() => { if (!solved) { setScratch('p4src', src === ch ? null : ch); setResult(null); sfx('click'); } }}>
            <rect x={x} y={166} width={116} height={150} rx="8" fill={src === ch ? '#26405c' : '#1a1f26'} stroke={src === ch ? '#6fb6ff' : '#3a434d'} strokeWidth="2.5" />
            <text x={x + 58} y={192} textAnchor="middle" fontSize="17" fill="#cfd4da" className="mono">{ch}</text>
            <rect x={x + 30} y={206} width={56} height={92} fill="#0c0f12" stroke="#2c343d" />
            <rect x={x + 32} y={298 - 88 * lv} width={52} height={88 * lv} fill={lv > 0.75 ? '#e0b64a' : '#4ad07a'} />
          </g>
        );
      })}
      {/* outputs */}
      <text x="60" y="380" fontSize="17" fill="#a9b1b9">出力先</text>
      {SOUND_OUTPUTS.map((o, i) => {
        const on = outs.includes(o);
        const x = 60 + (i % 4) * 280, y = 396 + Math.floor(i / 4) * 92;
        return (
          <g key={o} className="tap" data-testid={`out-${o}`} onClick={() => { if (!solved) { setScratch('p4out', on ? outs.filter((v) => v !== o) : [...outs, o]); setResult(null); sfx('click'); } }}>
            <rect x={x} y={y} width={258} height={72} rx="8" fill={on ? '#2a4034' : '#1a1f26'} stroke={on ? '#5fd694' : '#3a434d'} strokeWidth="2.5" />
            <circle cx={x + 28} cy={y + 36} r="10" fill={on ? '#5fd694' : '#39424c'} />
            <text x={x + 52} y={y + 43} fontSize="21" fill="#dfe3e8" className="mono">{o}</text>
            {on && <text x={x + 246} y={y + 43} textAnchor="end" fontSize="14" fill={SOUND_OUT_STATE[o] === 'OK' ? '#7fe0a6' : '#ffa06a'}>{SOUND_OUT_STATE[o]}</text>}
          </g>
        );
      })}
      <text x="60" y="628" fontSize="15" fill="#8d959d">HOUSE＝客席／LOBBY＝ロビー／DRESS＝楽屋／BS＝バックステージ・搬入口系統　　-1 本線 ／ -2 予備</text>
      <g className="tap" onClick={apply} data-testid="sound-apply">
        <rect x={W - 330} y={H - 96} width="270" height="60" rx="30" fill={solved ? '#1f3a29' : '#2f3742'} stroke={solved ? '#2ee06a' : '#6f7884'} strokeWidth="3" />
        <text x={W - 195} y={H - 56} textAnchor="middle" fontSize="22" fill={solved ? '#8ff0b6' : '#e2e6ea'}>{solved ? '送出中' : '送出 (APPLY)'}</text>
      </g>
      {result && !solved && <text x="60" y={H - 56} fontSize="18" fill="#ff8a76">{result}</text>}
      {solved && <text x="60" y={H - 56} fontSize="18" fill="#8ff0b6">放送系統 復旧（客席・ロビー・搬入口）</text>}
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
/** The floor seen from the stage: 上手 is on the LEFT, the front edge is far away (top). */
export function StageFloor() {
  const s = useGame((x) => x);
  const glow = !!s.solved.p8;
  const W = 1600, H = 900;
  // perspective helpers: depth 1 (front edge, far) .. 3 (upstage, near camera)
  const rowY = [430, 560, 740];
  const rowScale = [0.55, 0.78, 1.05];
  const px = (side: number, depth: number) => 800 - side * 118 * rowScale[depth - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="stage-floor">
      <image href={img('stagefloor')} x="0" y="0" width={W} height={H} style={{ filter: glow ? 'brightness(0.5)' : 'brightness(0.85)' }} />
      {/* front-edge numbering tape */}
      {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((n) => (
        <g key={n}>
          <rect x={px(n, 1) - 26} y={352} width="52" height="26" fill="#efece2" opacity="0.92" />
          <text x={px(n, 1)} y={372} textAnchor="middle" fontSize="19" fill="#2a2d33">{sideLabel(n)}</text>
        </g>
      ))}
      <text x="1470" y="344" fontSize="17" fill="#cfd4da">前端テープ</text>
      {[1, 2, 3].map((d) => (
        <g key={d}>
          <rect x={58} y={rowY[d - 1] - 16} width="46" height="32" fill="#efece2" opacity="0.8" />
          <text x={81} y={rowY[d - 1] + 8} textAnchor="middle" fontSize="20" fill="#2a2d33">{d}</text>
        </g>
      ))}
      <text x={60} y={rowY[2] + 60} fontSize="16" fill="#cfd4da">奥行きの列（1＝前端）</text>
      {/* ordinary spike marks (background colour tape) */}
      {[[-4, 1], [-1, 2], [2, 3], [4, 3], [-3, 3], [3, 1], [0, 1], [5, 2], [-5, 3], [1, 3], [-2, 2]].map(([sd, d], i) => (
        <rect key={i} x={px(sd, d) - 16} y={rowY[d - 1] - 6} width="32" height="12" rx="2"
          fill={['#d33a2c', '#2f6fd6', '#e6c229', '#efefe9'][i % 4]} opacity="0.75" transform={`rotate(${(i % 3) * 5 - 5} ${px(sd, d)} ${rowY[d - 1]})`} />
      ))}
      {/* glow marks */}
      {glow && GLOW_MARKS.map((m, i) => {
        const x = px(m.side, m.depth), y = rowY[m.depth - 1];
        const k = rowScale[m.depth - 1];
        return (
          <g key={i} data-testid={`glow-${m.side}-${m.depth}`}>
            <circle cx={x} cy={y} r={54 * k} fill="#9dffca" opacity="0.14" />
            <path d={`M${x - 26 * k} ${y - 4 * k} h${52 * k} v${8 * k} h${-22 * k} v${22 * k} h${-8 * k} v${-22 * k} z`} fill="#b8ffd8" opacity="0.92" />
          </g>
        );
      })}
      {glow && <text x={W / 2} y={120} textAnchor="middle" fontSize="24" fill="#b8ffd8">蓄光の印が、5か所だけ浮かび上がっている</text>}
      {!glow && <text x={W / 2} y={120} textAnchor="middle" fontSize="20" fill="#cfd4da">色とりどりのバミリ。前端には番号のテープが貼ってある</text>}
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
  const flip = (b: string) => {
    if (!connected || solved || tripped) return;
    const next = on.includes(b) ? on.filter((x) => x !== b) : [...on, b];
    sfx('breaker');
    if (next.length > 3) {
      setTripped(true);
      window.setTimeout(() => { sfx('trip'); setScratch('p6', []); say('発電機のうなりが乱れ、ブレーカーがまとめて落ちた。（同時に入れられるのは3系統まで）'); }, 700);
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
          setTripped(true);
          sfx('trip');
          setScratch('p6', []);
          say('しばらくして発電機の音が不規則に揺れ、ブレーカーが落ちた。');
          window.setTimeout(() => setTripped(false), 2000);
        }
      }, 1200);
    }
  };
  const W = 1200, H = 760;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="distro">
      <image href={img('distro')} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" style={{ filter: 'brightness(0.8)' }} />
      <rect x="215" y="150" width="770" height="420" fill="#4a525b" opacity="0.92" />
      <text x="250" y="196" fontSize="21" fill="#e4e8ec">仮設分電盤　TOUR DISTRO</text>
      <g>
        <circle cx="930" cy="188" r="13" fill={connected ? '#2ee06a' : '#5a636d'} />
        <text x="908" y="222" fontSize="14" fill="#cdd3d9" textAnchor="middle">INPUT</text>
      </g>
      {BREAKERS.map((b, i) => {
        const x = 250 + (i % 4) * 185, y = 240 + Math.floor(i / 4) * 150;
        const isOn = on.includes(b) && !tripped;
        return (
          <g key={b} className="tap" onClick={() => flip(b)} data-testid={`brk-${b}`}>
            <rect x={x} y={y} width={160} height={116} rx="6" fill="#2f353c" stroke="#1b1f24" strokeWidth="3" />
            <rect x={x + 54} y={y + 14} width={52} height={62} rx="5" fill="#d9dde2" />
            <rect x={x + 58} y={isOn ? y + 18 : y + 44} width={44} height={28} rx="4" fill={isOn ? '#d94b32' : '#6d757e'} />
            <text x={x + 80} y={y + 100} textAnchor="middle" fontSize="17" fill="#e4e8ec" className="mono">{b}</text>
          </g>
        );
      })}
      <g transform="translate(1010,190) rotate(4)">
        <rect x="0" y="0" width="160" height="150" fill="#fff59a" />
        <text x="80" y="42" textAnchor="middle" fontSize="17" fill="#333" fontFamily="var(--hand)">発電機</text>
        <text x="80" y="70" textAnchor="middle" fontSize="17" fill="#333" fontFamily="var(--hand)">燃料わずか！</text>
        <text x="80" y="104" textAnchor="middle" fontSize="19" fill="#b3261e" fontFamily="var(--hand)">同時3系統まで</text>
        <text x="80" y="130" textAnchor="middle" fontSize="14" fill="#333" fontFamily="var(--hand)">超えると全部落ちます</text>
      </g>
      {!connected && <text x={W / 2} y={620} textAnchor="middle" fontSize="22" fill="#ff8a76">入力ケーブルが届いていない</text>}
      {solved && <text x={W / 2} y={620} textAnchor="middle" fontSize="22" fill="#8ff0b6">3系統 送電中（LX-SL / FOH / DOCK SHT）</text>}
      {tripped && <text x={W / 2} y={660} textAnchor="middle" fontSize="20" fill="#ffb07a">遮断中…</text>}
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
    } else { setMsg('誘導ルートを確認できません（区画・扉・ゲートを確認してください）'); sfx('error'); }
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
        <text x="190" y="440" fontSize="22">{li(!!s.solved.p4, '③ 場内放送 回線（客席・ロビー・搬入口）')}</text>
        <text x="170" y="540" fontSize="17" fill="#6f7883">条件がそろうと、区画の指定ができます。</text>
      </svg>
    );
  }

  // stage-view map: 上手 (D,C) on the left, stage at the bottom
  const cw = 132, ch = 84, ox = 300, oy = 300;
  const colX = (c: string) => ox + STAGE_VIEW_COLS.indexOf(c) * (cw + 8);
  const rowY = (r: number) => oy + (3 - r) * (ch + 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="dock-panel">
      <rect x="0" y="0" width={W} height={H} fill="#0d1116" />
      <text x="60" y="58" fontSize="24" fill="#dfe3e8">残留者対応モード　誘導設定</text>
      <text x="60" y="86" fontSize="16" fill="#8d959d">図面：舞台側から　／　● ＝ 退場確認の記録</text>
      {/* gates */}
      {[1, 2, 3, 4, 5, 6].map((g, i) => (
        <g key={g} className="tap" data-testid={`gate-${g}`} onClick={() => { setGate(g); save('metaGate', g); sfx('click'); }}>
          <rect x={ox - 90 + i * 128} y={120} width={112} height={56} rx="6" fill={gate === g ? '#26405c' : '#1a1f26'} stroke={gate === g ? '#6fb6ff' : '#3a434d'} strokeWidth="2.5" />
          <text x={ox - 90 + i * 128 + 56} y={157} textAnchor="middle" fontSize="20" fill="#cfd4da">ゲート{g}</text>
        </g>
      ))}
      <text x={ox - 130} y={155} textAnchor="end" fontSize="16" fill="#7d858d">ロビー</text>
      {/* doors */}
      {([['TL', ox - 76, oy - 8], ['TR', ox + 4 * (cw + 8) + 10, oy - 8], ['BL', ox - 76, oy + 2 * (ch + 8) + 10], ['BR', ox + 4 * (cw + 8) + 10, oy + 2 * (ch + 8) + 10]] as const).map(([d, x, y]) => (
        <g key={d} className="tap" data-testid={`door-${d}`} onClick={() => { setDoor(d); save('metaDoor', d); sfx('click'); }}>
          <rect x={x} y={y} width={62} height={76} rx="4" fill={door === d ? '#26405c' : '#1a1f26'} stroke={door === d ? '#6fb6ff' : '#3a434d'} strokeWidth="2.5" />
          <path d={`M${x + 12} ${y + 60} l0 -44 l38 -8 l0 60 z`} fill="none" stroke="#7d858d" strokeWidth="2" />
        </g>
      ))}
      <text x={ox - 76} y={oy + 2 * (ch + 8) + 108} fontSize="14" fill="#7d858d">客席扉</text>
      {/* blocks */}
      {BLOCK_COLS.map((c) => BLOCK_ROWS.map((r) => {
        const id = `${c}${r}`;
        const sel = block === id;
        return (
          <g key={id} className="tap" data-testid={`mblk-${id}`} onClick={() => { setBlock(id); save('metaBlock', id); setMsg(null); sfx('click'); }}>
            <rect x={colX(c)} y={rowY(r)} width={cw} height={ch} rx="4" fill={sel ? '#5c3f14' : '#1a1f26'} stroke={sel ? '#ffd07a' : '#3a434d'} strokeWidth="2.5" />
            {Array.from({ length: CHECK_DOTS[id] }).map((_, i) => (
              <circle key={i} cx={colX(c) + cw / 2 + (i - (CHECK_DOTS[id] - 1) / 2) * 24} cy={rowY(r) + ch / 2} r="9" fill="#5fd694" opacity="0.9" />
            ))}
          </g>
        );
      }))}
      <rect x={ox} y={oy + 3 * (ch + 8) + 6} width={4 * (cw + 8) - 8} height="46" fill="#3a4048" />
      <text x={ox + (4 * (cw + 8) - 8) / 2} y={oy + 3 * (ch + 8) + 38} textAnchor="middle" fontSize="20" fill="#cfd4da" letterSpacing="6">STAGE</text>
      {/* readout */}
      <text x="60" y={H - 150} fontSize="18" fill="#a9b1b9">残留区画：<tspan fill="#ffd07a">{block ? '指定あり' : '未指定'}</tspan>　　誘導扉：<tspan fill="#ffd07a">{door ? '指定あり' : '未指定'}</tspan>　　退場ゲート：<tspan fill="#ffd07a">{gate ?? '未指定'}</tspan></text>
      <g className="tap" onClick={run} data-testid="meta-run">
        <rect x={W - 360} y={H - 120} width="300" height="64" rx="32" fill={solved ? '#1f3a29' : '#2f3742'} stroke={solved ? '#2ee06a' : '#6f7884'} strokeWidth="3" />
        <text x={W - 210} y={H - 78} textAnchor="middle" fontSize="23" fill={solved ? '#8ff0b6' : '#e2e6ea'}>{solved ? '誘導中' : '誘導開始'}</text>
      </g>
      {msg && !solved && <text x="60" y={H - 76} fontSize="17" fill="#ff8a76">{msg}</text>}
      {solved && <text x="60" y={H - 76} fontSize="17" fill="#8ff0b6">誘導灯・照明を順次点灯　→　6番ゲート 解錠</text>}
    </svg>
  );
}
