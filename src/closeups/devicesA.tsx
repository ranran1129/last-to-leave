import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { img } from '../game/assets';
import { setScratch, solve, findSecret, openCloseup } from '../game/engine';
import { say } from '../game/ui';
import { sfx } from '../audio/audio';
import { checkP1, checkP2, checkP3 } from '../game/puzzles';
import {
  BLOCK_COLS, BLOCK_ROWS, MERCH_ITEMS, MERCH_PRICES, MERCH_SOLDOUT, MERCH_COLS, STANDS, CART_ORDER, CARD_PILE, type Dir,
} from '../game/data';
import { STAND_X } from './docs';

// =====================================================================  P1
export function P1Panel() {
  const s = useGame((x) => x);
  const solved = !!s.solved.p1;
  const sel = ((s.scratch.p1 as string[]) ?? []);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = (id: string) => {
    if (solved) return;
    sfx('click');
    setScratch('p1', sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
    setMsg(null);
  };
  const submit = () => {
    if (solved) return;
    if (checkP1(sel)) {
      sfx('relay');
      window.setTimeout(() => sfx('unlock'), 500);
      solve('p1');
      setMsg('ok');
      say('パネルのランプが緑に変わり、扉のロックが外れる音がした。');
    } else {
      sfx('error');
      setMsg('選択されたブロックに、再案内の記録はありません');
    }
  };
  const W = 1000, H = 750, cw = 128, ch = 74, gap = 6, ox = 101, oy = 212;
  const gridW = BLOCK_COLS.length * (cw + gap) - gap;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="p1-panel" style={{ background: '#161a1f' }}>
      <rect x="0" y="0" width={W} height={H} fill="#1b2026" />
      <rect x="20" y="20" width={W - 40} height={H - 40} rx="10" fill="#22272e" stroke="#3a4048" strokeWidth="3" />
      <text x="50" y="72" fontSize="26" fill="#dfe3e8">規制退場パネル</text>
      <text x="50" y="104" fontSize="17" fill="#8d959d">客席扉4 / ARENA GATE CONTROL</text>
      <g>
        <circle cx={W - 80} cy="80" r="16" fill={solved ? '#2ee06a' : '#c8382c'} />
        <text x={W - 108} y="120" fontSize="15" fill="#8d959d" textAnchor="middle">{solved ? '解錠' : '施錠'}</text>
      </g>
      <rect x={ox + gridW * 0.2} y="150" width={gridW * 0.6} height="42" fill="#3a4048" />
      <text x={ox + gridW / 2} y="179" textAnchor="middle" fontSize="21" fill="#cfd4da" letterSpacing="8">STAGE</text>
      {BLOCK_ROWS.map((r) => BLOCK_COLS.map((c, ci) => {
        const id = `${c}${r}`;
        const on = sel.includes(id);
        return (
          <g key={id} className="tap" onClick={() => toggle(id)} data-testid={`blk-${id}`}>
            <rect x={ox + ci * (cw + gap)} y={oy + (r - 1) * (ch + gap)} width={cw} height={ch} rx="5"
              fill={on ? '#c9862a' : '#2b3138'} stroke={on ? '#ffd07a' : '#454c55'} strokeWidth="2.5" />
            <text x={ox + ci * (cw + gap) + cw / 2} y={oy + (r - 1) * (ch + gap) + ch / 2 + 10} textAnchor="middle"
              fontSize="27" fill={on ? '#1a1206' : '#98a0a8'}>{id}</text>
          </g>
        );
      }))}
      <text x={ox} y={oy + BLOCK_ROWS.length * (ch + gap) + 26} fontSize="14" fill="#7d858d">アリーナ仮設ブロック（STAGE側が1段目／1ブロック＝12列）</text>
      <g className="tap" onClick={submit} data-testid="p1-submit">
        <rect x={W / 2 - 150} y={H - 86} width="300" height="58" rx="29" fill={solved ? '#1f3a29' : '#2f3742'} stroke={solved ? '#2ee06a' : '#6f7884'} strokeWidth="3" />
        <text x={W / 2} y={H - 48} textAnchor="middle" fontSize="23" fill={solved ? '#8ff0b6' : '#e2e6ea'}>{solved ? '再案内中…' : '最終組 再案内'}</text>
      </g>
      {msg && msg !== 'ok' && <text x={W - 40} y={oy + BLOCK_ROWS.length * (ch + gap) + 26} textAnchor="end" fontSize="17" fill="#ff8a76">{msg}</text>}
      {solved && <text x={W - 40} y={oy + BLOCK_ROWS.length * (ch + gap) + 26} textAnchor="end" fontSize="17" fill="#8ff0b6">扉4 解錠／誘導灯 点灯</text>}
    </svg>
  );
}

// =====================================================================  P2 board
export function MerchBoard() {
  const W = 760, H = 1010, cw = 340, chh = 195, ox = 36, oy = 130;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="merch-board" style={{ background: '#f4f2ec' }}>
      <rect x="0" y="0" width={W} height={H} fill="#f7f5ef" />
      <rect x="0" y="0" width={W} height="96" fill="#ef8c3c" />
      <text x={W / 2} y="56" textAnchor="middle" fontSize="33" fill="#fff" letterSpacing="5">濱岸ひより考案グッズ</text>
      <text x={W / 2} y="84" textAnchor="middle" fontSize="15" fill="#fff5ea">※番号でお申し付けください（価格は税込）</text>
      {MERCH_ITEMS.map((name, i) => {
        const cx = ox + (i % MERCH_COLS) * (cw + 8), cy = oy + Math.floor(i / MERCH_COLS) * (chh + 6);
        const sold = MERCH_SOLDOUT.includes(i + 1);
        const lines = name.split('\n');
        return (
          <g key={name}>
            <rect x={cx} y={cy} width={cw} height={chh} fill="#fff" stroke="#c9c5bb" strokeWidth="2" />
            <text x={cx + 14} y={cy + 32} fontSize="22" fill="#9aa0a6" className="mono">{i + 1}</text>
            <rect x={cx + 44} y={cy + 44} width={cw - 88} height="56" fill="#eeebe2" />
            {lines.map((line, k) => (
              <text key={k} x={cx + cw / 2} y={cy + 128 + k * 24} textAnchor="middle" fontSize="18" fill="#2c2f34">{line}</text>
            ))}
            <text x={cx + cw / 2} y={cy + 128 + lines.length * 24 + 6} textAnchor="middle" fontSize="19" fill="#b2432c" fontWeight="700">
              {MERCH_PRICES[i]}
            </text>
            {sold && (
              <g transform={`rotate(-12 ${cx + cw - 46} ${cy + 66})`}>
                <circle cx={cx + cw - 46} cy={cy + 66} r="34" fill="#d33a2c" opacity="0.93" />
                <text x={cx + cw - 46} y={cy + 74} textAnchor="middle" fontSize="21" fill="#fff">完売</text>
              </g>
            )}
          </g>
        );
      })}
      <text x={W / 2} y={H - 16} textAnchor="middle" fontSize="15" fill="#8b9098">完売の札（マグネット）はそのまま貼られている</text>
    </svg>
  );
}

// =====================================================================  P2 lock
const DIRS: { d: Dir; path: string; x: number; y: number }[] = [
  { d: 'U', path: 'M0 -26 L20 6 L-20 6 Z', x: 0, y: -70 },
  { d: 'D', path: 'M0 26 L-20 -6 L20 -6 Z', x: 0, y: 70 },
  { d: 'L', path: 'M-26 0 L6 -20 L6 20 Z', x: -70, y: 0 },
  { d: 'R', path: 'M26 0 L-6 20 L-6 -20 Z', x: 70, y: 0 },
];

export function DirLock() {
  const s = useGame((x) => x);
  const solved = !!s.solved.p2;
  const seq = ((s.scratch.p2 as Dir[]) ?? []);
  const [shake, setShake] = useState(0);
  const push = (d: Dir) => {
    if (solved || seq.length >= 10) return;
    sfx('click');
    setScratch('p2', [...seq, d]);
  };
  const pull = () => {
    if (solved) return;
    if (checkP2(seq)) {
      sfx('unlock');
      solve('p2');
      say('かちり、と芯が抜けた。方向錠が外れる。');
    } else {
      sfx('lock');
      setShake(shake + 1);
      setScratch('p2', []);
      say('シャックルは動かない。つまみが元に戻った。');
    }
  };
  const cx = 350, cy = 330;
  return (
    <svg viewBox="0 0 700 750" className="device" data-testid="dirlock" style={{ background: 'radial-gradient(#20252b,#0b0d10)' }}>
      <g key={shake} style={{ animation: shake ? 'capIn .18s' : undefined }}>
        <rect x="200" y="120" width="300" height="60" rx="30" fill="none" stroke={solved ? '#79e39f' : '#b9c0c8'} strokeWidth="22"
          transform={solved ? 'translate(60,-40) rotate(18 350 150)' : ''} />
        <rect x="150" y="170" width="400" height="330" rx="26" fill="#4d5560" stroke="#2c3138" strokeWidth="6" />
        <circle cx={cx} cy={cy} r="120" fill="#2a2f36" />
        {DIRS.map((d) => (
          <g key={d.d} className="tap" onClick={() => push(d.d)} data-testid={`dir-${d.d}`} transform={`translate(${cx + d.x} ${cy + d.y})`}>
            <circle r="42" fill="#3a424b" stroke="#5c6670" strokeWidth="2" />
            <path d={d.path} fill="#d6dbe1" />
          </g>
        ))}
        <circle cx={cx} cy={cy} r="30" fill="#59626d" stroke="#2c3138" strokeWidth="3" />
      </g>
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={i} cx={160 + i * 42} cy="560" r="11" fill={i < seq.length ? '#ffce6a' : '#39404a'} />
      ))}
      <text x="350" y="605" textAnchor="middle" fontSize="16" fill="#8d959d">入力された回数だけ、印が点く（向きは表示されない）</text>
      <g className="tap" onClick={pull} data-testid="lock-pull">
        <rect x="120" y="640" width="210" height="60" rx="30" fill="#2f3742" stroke="#6f7884" strokeWidth="3" />
        <text x="225" y="679" textAnchor="middle" fontSize="22" fill="#e2e6ea">引いてみる</text>
      </g>
      <g className="tap" onClick={() => { setScratch('p2', []); sfx('click'); }}>
        <rect x="370" y="640" width="210" height="60" rx="30" fill="#242a31" stroke="#4a525c" strokeWidth="3" />
        <text x="475" y="679" textAnchor="middle" fontSize="22" fill="#aeb6be">リセット</text>
      </g>
      {solved && <text x="350" y="90" textAnchor="middle" fontSize="26" fill="#8ff0b6">開いた</text>}
    </svg>
  );
}

// =====================================================================  P3 stands
/** 祝花エリアの写真をそのまま拡大して見る。花はタップすると近くで確認できる */
export function StandsView() {
  const [sel, setSel] = useState<string | null>(null);
  const W = 1600, H = 900;
  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="device" data-testid="stands">
        <image href={img('flowers')} x="0" y="0" width={W} height={H} style={{ filter: 'brightness(1.12)' }} />
        {CART_ORDER.map((id) => {
          const x = STAND_X[id] * W;
          return (
            <g key={id} className="tap" data-testid={`stand-${id}`} onClick={() => setSel(id)}>
              <rect x={x - 70} y={240} width={140} height={440} fill="transparent" />
              {sel === id && <rect x={x - 74} y={236} width={148} height={448} rx="10" fill="none" stroke="#ffce6a" strokeWidth="4" opacity="0.9" />}
            </g>
          );
        })}
      </svg>
      <p style={{ textAlign: 'center', fontSize: 14, color: '#cfd4da', minHeight: 44, margin: '8px 0 0' }} data-testid="stand-desc">
        {sel ? describeStand(sel) : '回収を待つ祝花。札はすべて外されている。花をタップすると近くで見られる。'}
      </p>
    </div>
  );
}

function describeStand(id: string) {
  const st = STANDS.find((x) => x.id === id)!;
  const v = st.vase === 'round' ? '丸い鉢' : '四角い鉢';
  return `${st.colorName}の${st.flower}／${v}。札は外されている。`;
}

// =====================================================================  P3 rack
export function CardRack() {
  const s = useGame((x) => x);
  const solved = !!s.solved.p3;
  const slots = ((s.scratch.p3 as (string | null)[]) ?? [null, null, null, null, null]);
  const [held, setHeld] = useState<string | null>(null);
  const [flip, setFlip] = useState<string | null>(null);
  const pile = CARD_PILE.filter((c) => !slots.includes(c));

  const place = (i: number) => {
    if (solved) return;
    const next = [...slots];
    if (held) {
      const prev = next.indexOf(held);
      if (prev >= 0) next[prev] = null;
      next[i] = held;
      setHeld(null);
    } else if (next[i]) {
      setHeld(next[i]);
      next[i] = null;
    } else return;
    sfx('paper');
    setScratch('p3', next);
    if (next.every(Boolean)) {
      window.setTimeout(() => {
        if (checkP3(next)) {
          sfx('relay'); window.setTimeout(() => sfx('door'), 600);
          solve('p3');
          say('ボックスのランプが緑に変わり、関係者通路の扉がかすかに動いた。');
        } else { sfx('error'); say('ボックスのランプが赤く点滅した。並びが合っていないらしい。'); }
      }, 350);
    }
  };

  const card = (id: string, x: number, y: number, w = 210, h = 128, small = false) => {
    const st = STANDS.find((c) => c.id === id)!;
    const isFlipped = flip === id;
    const arch = Math.round(h * 0.3);
    const d = st.vase === 'round'
      ? `M${x} ${y + h} v${-(h - arch)} a${w / 2} ${arch} 0 0 1 ${w} 0 v${h - arch} z`
      : `M${x} ${y} h${w} v${h} h${-w} z`;
    return (
      <g key={id} className="tap" data-testid={`card-${id}`}
        onClick={(e) => { e.stopPropagation(); if (!solved) { setHeld(held === id ? null : id); setFlip(null); sfx('paper'); } }}>
        <path d={d} fill={isFlipped ? '#f0ece1' : '#fbf8f0'} stroke={held === id ? '#ffce6a' : st.color} strokeWidth={held === id ? 6 : 5} />
        {!isFlipped ? (
          <>
            <text x={x + w / 2} y={y + h * 0.42} textAnchor="middle" fontSize="15" fill="#8c7a4a">祝　卒業</text>
            {st.sender.split('\n').map((ln, i) => (
              <text key={i} x={x + w / 2} y={y + h * 0.66 + i * 19} textAnchor="middle" fontSize={small ? 13 : 15} fill="#2f3440">{ln}</text>
            ))}
          </>
        ) : (
          st.back
            ? st.back.split('\n').map((ln, i) => <text key={i} x={x + w / 2} y={y + h * 0.5 + i * 22} textAnchor="middle" fontSize="16" fill="#3a4a86" fontFamily="var(--hand)">{ln}</text>)
            : <text x={x + w / 2} y={y + h * 0.55} textAnchor="middle" fontSize="15" fill="#9aa0a6">（裏は白紙）</text>
        )}
      </g>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox="0 0 1200 780" className="device" data-testid="rack" style={{ background: '#1a1e24' }}>
        <rect x="30" y="20" width="1140" height="330" rx="12" fill="#262c33" stroke="#3d454e" strokeWidth="3" />
        <text x="60" y="62" fontSize="24" fill="#dfe3e8">祝花回収用　扉開放ボックス</text>
        <text x="60" y="92" fontSize="16" fill="#8d959d">札を「設置時の並び順」に差し込むと、搬出用に扉を開放します（1＝入口側）</text>
        {slots.map((c, i) => (
          <g key={i} className="tap" onClick={() => place(i)} data-testid={`slot-${i}`}>
            <rect x={55 + i * 222} y={120} width="210" height="190" rx="6" fill="#1c2127" stroke="#4a525c" strokeWidth="3" strokeDasharray={c ? '' : '8 6'} />
            <text x={60 + i * 222 + 105} y={148} textAnchor="middle" fontSize="18" fill="#7d858d">{i + 1}{i === 0 ? '（入口側）' : ''}</text>
            {c && card(c, 55 + i * 222 + 5, 158, 200, 128, true)}
          </g>
        ))}
        <g>
          <circle cx="1110" cy="62" r="14" fill={solved ? '#2ee06a' : '#c8382c'} />
        </g>
        <text x="60" y="400" fontSize="18" fill="#a9b1b9">外された札（机の上）</text>
        {pile.map((id, i) => card(id, 60 + i * 226, 430, 210, 140))}
        <g className="tap" onClick={() => openCloseup('delivery')} data-testid="open-delivery">
          <rect x="60" y="600" width="300" height="56" rx="28" fill="#2f3742" stroke="#6f7884" strokeWidth="3" />
          <text x="210" y="636" textAnchor="middle" fontSize="20" fill="#e2e6ea">花屋の納品書を見る</text>
        </g>
        {held && (
          <g className="tap" onClick={() => setFlip(flip === held ? null : held)} data-testid="flip-card">
            <rect x="880" y="600" width="260" height="56" rx="28" fill="#2f3742" stroke="#6f7884" strokeWidth="3" />
            <text x="1010" y="636" textAnchor="middle" fontSize="20" fill="#e2e6ea">{flip === held ? '表に戻す' : '選んだ札を裏返す'}</text>
          </g>
        )}
        {flip === 'S5' && <FlipSecret />}
        <text x="600" y="750" textAnchor="middle" fontSize="16" fill="#8d959d">札をタップ → 差し込み口をタップ（差した札はもう一度タップで戻せる）</text>
      </svg>
    </div>
  );
}

function FlipSecret() {
  useEffect(() => {
    findSecret('cardback', '札の裏に、小さな字で一行だけ書かれていた。「福岡に、おかえりなさい。そして、いってらっしゃい。」');
  }, []);
  return null;
}
