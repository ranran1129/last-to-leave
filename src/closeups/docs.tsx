import { useEffect } from 'react';
import { useGame } from '../game/store';
import { img } from '../game/assets';
import { BLOCK_COLS, BLOCK_ROWS, MERCH_NOTES, PLAYER_SEAT, VENUE } from '../game/data';
import { findSecret, setPenColor } from '../game/engine';
import { PEN_COLORS, ITEMS } from '../game/items';
import type { PenColor } from '../game/types';
import { PA_LINES } from '../components/PAText';

export interface ViewProps { photo?: boolean }

/** 客席側スタッフが実際に確認したブロック（1〜4段目の全部と、5段目の A・B・C） */
export const FOH_MARKS = [
  ...BLOCK_COLS.flatMap((c) => [1, 2, 3, 4].map((r) => `${c}${r}`)),
  'A5', 'B5', 'C5',
];
/** 舞台側スタッフが「D・E・F」のつもりで確認したブロック（図面が逆向きのため実際は C・B・A） */
export const STAGE_MARKS = ['A5', 'B5', 'C5'];

// ------------------------------------------------------------ helpers
function SeatMap({ view, marks = [], letters = 'print', note, stands = true }: {
  view: 'audience' | 'stage'; marks?: string[]; letters?: 'print' | 'hand-wrong' | 'none'; note?: string; stands?: boolean;
}) {
  // 客席から見た図はステージが上、舞台から見た図はステージが下。
  const cols = [...BLOCK_COLS];
  const nc = cols.length, nr = BLOCK_ROWS.length;
  const cw = 68, ch = 42, gap = 4, ox = 54;
  const gridW = nc * (cw + gap) - gap, gridH = nr * (ch + gap) - gap;
  const W = ox * 2 + gridW, H = gridH + 128;
  const oy = view === 'audience' ? 74 : 26;
  const stageY = view === 'audience' ? 16 : oy + gridH + 12;
  const colX = (c: string) => {
    const i = cols.indexOf(c as never);
    return ox + (view === 'audience' ? i : nc - 1 - i) * (cw + gap);
  };
  const rowY = (r: number) => (view === 'audience' ? oy + (r - 1) * (ch + gap) : oy + (nr - r) * (ch + gap));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 520, display: 'block', margin: '6px auto' }}>
      {/* アリーナを四方から囲む1階・2階スタンド */}
      {stands && [0, 1].map((ring) => (
        <rect key={ring} x={ox - 22 - ring * 14} y={(view === 'audience' ? 10 : oy - 22) - ring * 14}
          width={gridW + 44 + ring * 28} height={gridH + (view === 'audience' ? 106 : 100) + ring * 28} rx="8"
          fill="none" stroke="#bdb8aa" strokeWidth="1.2" strokeDasharray={ring ? '4 4' : '6 4'} />
      ))}
      {stands && <text x={ox - 30} y={oy + gridH / 2} fontSize="10" fill="#8b8675" textAnchor="middle" transform={`rotate(-90 ${ox - 30} ${oy + gridH / 2})`}>1階／2階スタンド</text>}
      <rect x={ox + gridW * 0.12} y={stageY} width={gridW * 0.76} height={42} fill="#3b3d44" />
      <text x={ox + gridW / 2} y={stageY + 28} textAnchor="middle" fill="#fff" fontSize="18" letterSpacing="6">STAGE</text>
      {cols.map((c) => BLOCK_ROWS.map((r) => {
        const id = `${c}${r}`;
        return (
          <g key={id}>
            <rect x={colX(c)} y={rowY(r)} width={cw} height={ch} fill="none" stroke="#555" strokeWidth="1.3" />
            {marks.includes(id) && (
              <path d={`M${colX(c) + 18} ${rowY(r) + 23} l8 9 l19 -20`} stroke="#c23a2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      }))}
      {letters === 'print' && cols.map((c) => BLOCK_ROWS.map((r) => (
        <text key={`t${c}${r}`} x={colX(c) + 5} y={rowY(r) + 14} fontSize="11" fill="#444">{c}{r}</text>
      )))}
      {letters === 'hand-wrong' && cols.map((c, i) => (
        <text key={c} x={ox + i * (cw + gap) + cw / 2} y={oy - 8} textAnchor="middle" fontSize="19" fill="#1f2c55" fontFamily="var(--hand)">{c}</text>
      ))}
      {letters === 'hand-wrong' && [...BLOCK_ROWS].reverse().map((r, i) => (
        <text key={r} x={ox - 14} y={oy + i * (ch + gap) + 27} textAnchor="middle" fontSize="17" fill="#1f2c55" fontFamily="var(--hand)">{r}</text>
      ))}
      {note && <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11.5" fill="#666">{note}</text>}
    </svg>
  );
}

// ------------------------------------------------------------ items
export function TicketView() {
  return (
    <div style={{ display: 'grid', gap: 14, width: '100%' }}>
      <div className="paper" style={{ background: 'linear-gradient(90deg,#f4efe2 0 72%,#e8e1cf 72%)', padding: '22px 26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.2em', color: '#6a6f76' }}>ELECTRONIC TICKET</div>
            <div style={{ fontSize: 19, fontWeight: 700, margin: '4px 0 2px', color: '#3a8fc4' }}>日向坂46 Happy Magical Tour 2024</div>
            <div style={{ fontSize: 14 }}>2024年12月5日（木）　マリンメッセ福岡A館</div>
            <div style={{ fontSize: 13, color: '#555' }}>開場 16:30 ／ 開演 18:00</div>
            <div style={{ marginTop: 12, fontSize: 13, color: '#555' }}>座席</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.04em' }} data-testid="ticket-seat">
              アリーナ {PLAYER_SEAT.block}ブロック {PLAYER_SEAT.row}列 {PLAYER_SEAT.seat}番
            </div>
          </div>
          <div style={{ borderLeft: '2px dashed #b5ad98', paddingLeft: 14, fontSize: 12, color: '#555', lineHeight: 1.7 }}>
            入場済<br />16:42<br /><span style={{ fontSize: 10 }}>※このチケットはゲーム用に作った架空のデザインです。</span>
          </div>
        </div>
      </div>
      <div className="paper" style={{ padding: '16px 22px' }}>
        <div className="small" style={{ fontWeight: 700 }}>裏面　アリーナ座席図（客席から見た図）</div>
        <SeatMap view="audience" note={`※アリーナのブロックは公演ごとに仮設されます（1ブロック＝12列）／${VENUE.standsF1}・${VENUE.standsF2}`} />
      </div>
    </div>
  );
}

export function PenlightView() {
  const pen = useGame((s) => s.penColor);
  const c = PEN_COLORS[pen];
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <svg viewBox="0 0 800 420" className="device" style={{ background: 'radial-gradient(#1a1f27,#07090c)' }}>
        <defs>
          <radialGradient id="pglow"><stop offset="0" stopColor={c.hex} stopOpacity="0.75" /><stop offset="1" stopColor={c.hex} stopOpacity="0" /></radialGradient>
          <linearGradient id="ptube" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.4" stopColor={c.hex} /><stop offset="1" stopColor={c.hex} stopOpacity="0.8" /></linearGradient>
        </defs>
        <ellipse cx="330" cy="210" rx="300" ry="150" fill="url(#pglow)" />
        <rect x="120" y="185" width="400" height="50" rx="25" fill="url(#ptube)" />
        <rect x="510" y="178" width="190" height="64" rx="10" fill="#23272e" stroke="#444" />
        <circle cx="600" cy="210" r="16" fill="#3a3f47" stroke="#666" />
        <text x="600" y="275" textAnchor="middle" fill="#999" fontSize="18">色切替ボタン</text>
      </svg>
      <p style={{ margin: '10px 0 6px', fontSize: 14 }}>{ITEMS.penlight.desc}　いまの色：<b style={{ color: c.hex }}>{c.name}</b></p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {(Object.keys(PEN_COLORS) as PenColor[]).map((k) => (
          <button key={k} className="btn" data-testid={`pen-${k}`} onClick={() => setPenColor(k)}
            style={{ borderColor: pen === k ? PEN_COLORS[k].hex : undefined }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: PEN_COLORS[k].hex, display: 'inline-block' }} />
            {PEN_COLORS[k].name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DrumView() {
  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <div style={{ background: 'radial-gradient(#20252b,#0b0d10)', borderRadius: 12, padding: 18 }}>
        <img src={img('prop_drum')} alt="電源ドラム" style={{ width: '100%', maxWidth: 420, filter: 'brightness(0.95)' }} />
      </div>
      <p style={{ fontSize: 14, color: '#cfd4da', marginTop: 10 }}>
        物販ブースの照明に使われていた電源ドラム。コードはまだたっぷり巻かれている。<br />
        側面に、油性ペンで「物販用（使ったら巻いて戻すこと）」と書いてある。
      </p>
    </div>
  );
}

export function SilverTapeView() {
  return (
    <div className="paper" style={{ background: 'linear-gradient(180deg,#e6eaee,#b9c1c9 45%,#8f98a1 55%,#dfe4e9)', textAlign: 'center' }}>
      <div style={{ letterSpacing: '0.18em', fontSize: 20, color: '#4d5761', padding: '18px 0', fontWeight: 700 }}>
        ひよたん♪ひよたん♪　ひよたん♪ひよたん♪　ひよたん♪
      </div>
      <p className="small">客席に放たれた銀テープ。誰かが拾って巻いたまま、椅子の下に置き忘れていったらしい。</p>
    </div>
  );
}

// ------------------------------------------------------------ arena
export function Announce6View() {
  return (
    <div className="paper" style={{ maxWidth: 620 }}>
      <div className="clip" />
      <h3>規制退場 ご案内 ⑥（最終）</h3>
      <p style={{ fontSize: 17, lineHeight: 2.1, margin: '6px 0 12px' }} data-testid="announce-text">
        大変長らくお待たせいたしました。<br />これが最後のご案内です。<br />
        アリーナ席、<u>ステージからいちばん遠い段</u>の、<br /><u>上手側のブロック</u>にお座りのお客様、ご退場ください。<br />
        お忘れ物のないよう、お手元をお確かめください。
      </p>
      <div className="hand" style={{ textAlign: 'right' }}>23:02 読み上げ完了　→ 最後の客席確認は客席側と舞台側で分担</div>
    </div>
  );
}

export function CasesView() {
  const tag = (x: number, y: number, w: number, color: string) => <rect x={x} y={y} width={w} height={14} fill={color} opacity="0.92" />;
  const stencil = (x: number, y: number, a: string, b: string, size = 38) => (
    <g fill="#e9e6de" opacity="0.88" style={{ fontFamily: 'var(--sans)', fontWeight: 700 }}>
      <text x={x} y={y} textAnchor="middle" fontSize={size}>{a}</text>
      <text x={x} y={y + size * 0.95} textAnchor="middle" fontSize={size * 0.72} className="mono" letterSpacing="4">{b}</text>
    </g>
  );
  return (
    <svg viewBox="0 250 1600 330" className="device" data-testid="cases-svg">
      <image href={img('stagefront')} x="0" y="0" width="1600" height="900" />
      <rect x="0" y="290" width="1600" height="230" fill="rgba(0,0,0,0.12)" />
      {/* left = 下手 */}
      {tag(62, 346, 236, '#2f6fd6')}
      {stencil(180, 398, '下手', 'SR')}
      {/* center */}
      {tag(688, 346, 150, '#e6c229')}
      {stencil(763, 398, 'CTR', '0', 30)}
      {/* right = 上手 */}
      {tag(1278, 396, 118, '#d63b2f')}
      {stencil(1337, 428, '上手', 'SL', 26)}
      {tag(1424, 396, 94, '#d63b2f')}
      <g className="tap" onClick={() => findSecret('hiyoko', 'ケースの角に、小さなひよこのシールが貼ってある。誰かの、ささやかな置き土産。')} data-testid="secret-hiyoko">
        <rect x="1470" y="415" width="44" height="44" fill="transparent" />
        <circle cx="1492" cy="438" r="11" fill="#ffd84a" opacity="0.9" />
        <circle cx="1488" cy="435" r="1.6" fill="#333" /><path d="M1493 439 l6 -1 l-5 3z" fill="#f39a1e" />
      </g>
      <text x="800" y="508" textAnchor="middle" fontSize="15" fill="#aaa">ステージ前端のケース（客席から見ている）</text>
    </svg>
  );
}

export function FohSheetView() {
  return (
    <div className="paper" style={{ maxWidth: 600 }}>
      <div className="clip" />
      <h3>退場確認（客席側）12月5日</h3>
      <SeatMap view="audience" marks={FOH_MARKS} />
      <div className="hand">
        1〜4段目 → 全ブロック 確認済み（22:58）<br />
        5段目 A5・B5・C5 確認済み（23:19）<br />
        D・E・F は舞台側が見てくれるとのこと → 無線で報告を受ける
      </div>
    </div>
  );
}

// ------------------------------------------------------------ lobby
export function GateDisplayView() {
  const s = useGame((x) => x);
  const open = !!s.solved.meta;
  return (
    <svg viewBox="0 0 1000 420" className="device" style={{ background: '#050607' }}>
      <image href={img('gate')} x="-300" y="-300" width="1600" height="900" opacity="0.35" />
      <rect x="220" y="80" width="560" height="170" rx="8" fill="#0b0d0f" stroke="#333" strokeWidth="6" />
      {open ? (
        <>
          <text x="500" y="150" textAnchor="middle" fontSize="44" fill="#39e27f" className="mono">EXIT 6  OPEN</text>
          <text x="500" y="210" textAnchor="middle" fontSize="26" fill="#39e27f">6番出口　開放中</text>
        </>
      ) : (
        <>
          <text x="500" y="150" textAnchor="middle" fontSize="40" fill="#ff5a3c" className="mono">CLOSED</text>
          <text x="500" y="210" textAnchor="middle" fontSize="26" fill="#ff5a3c">閉館処理中　全出口 施錠</text>
        </>
      )}
      <text x="500" y="320" textAnchor="middle" fontSize="20" fill="#999">出口 1　2　3　4　5　6</text>
    </svg>
  );
}

export function MerchNotesView() {
  return (
    <div className="paper" style={{ background: '#6b5a44', padding: '34px 20px 24px' }}>
      <div className="clip" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }} data-testid="merch-notes">
        {MERCH_NOTES.map((n, i) => (
          <div key={i} style={{ background: i % 3 === 0 ? '#fff59a' : i % 3 === 1 ? '#ffd1e3' : '#c9f1ff', color: '#222', padding: '10px 12px 14px', transform: `rotate(${n.rot}deg)`, boxShadow: '0 4px 8px rgba(0,0,0,0.4)', fontFamily: 'var(--hand)', fontSize: 16, lineHeight: 1.5 }}>
            {n.text}<br /><span style={{ fontSize: 20 }}>{n.time}</span>
          </div>
        ))}
      </div>
      <div style={{ color: '#f3ead8', fontSize: 12, marginTop: 14, textAlign: 'right' }}>会計台のクリップボードに貼られた付箋</div>
    </div>
  );
}

export function DoorNoteView() {
  return (
    <div className="paper" style={{ maxWidth: 520, background: '#fff' }}>
      <p className="hand" style={{ fontSize: 22, lineHeight: 2 }}>
        ストック室　閉めました！<br />
        開け方は いつもどおり<br />
        「<b>売り切れた順</b>」で。<br />
        <span style={{ fontSize: 16 }}>― 物販 M</span>
      </p>
      <div className="small">扉に養生テープで貼られたメモ。扉の掛け金には、上下左右にだけ動くつまみの南京錠。</div>
    </div>
  );
}

export function PreshowView() {
  return (
    <div style={{ width: '100%' }}>
      <img src={img('preshow')} className="device" alt="開演前の祝花" />
      <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', margin: '8px 0 0' }}>
        16:38　入場してすぐに撮った、コンコースの祝花（人が多くて、花器のあたりは写っていない）
      </p>
    </div>
  );
}

/** 花屋が置いていった納品書。送り主と花の内容を結びつける手掛かり */
export function DeliveryNoteView() {
  return (
    <div className="paper" style={{ maxWidth: 620 }}>
      <div className="clip" />
      <h3>祝花 納品書（控）　12月5日</h3>
      <div className="small" style={{ marginBottom: 8 }}>マリンメッセ福岡A館　コンコース　※終演後、回収にうかがいます</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #3b3d44' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>お届け先名（札）</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>内容</th>
          </tr>
        </thead>
        <tbody>
          {STANDS.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px dotted #b9b3a4' }}>
              <td style={{ padding: '7px 4px' }}>{s.sender.replace('\n', '')}</td>
              <td style={{ padding: '7px 4px' }}>{s.colorName}の{s.flower}／{s.vase === 'round' ? '丸鉢' : '角鉢'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hand" style={{ fontSize: 15, marginTop: 12 }}>札は外して机の上にまとめました</p>
    </div>
  );
}

import { STANDS } from '../game/data';
/** 祝花エリアの写真の中で、各祝花が立っている位置（x の割合） */
export const STAND_X: Record<string, number> = { S1: 0.075, S2: 0.19, S3: 0.30, S4: 0.395, S5: 0.485 };

/** square crop of the pre-show photo for the phone's photo roll */
export function PreshowThumb() {
  return <img src={img('preshow')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

export function PenlightsPhotoView() {
  return (
    <div style={{ width: '100%' }}>
      <img src={img('penlights')} className="device" alt="公演中の客席" />
      <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', margin: '8px 0 0' }}>20:52　公演中。ブレていて、ほとんど光しか写っていない。</p>
    </div>
  );
}

/**
 * Optional sub-puzzle: if the player photographed both check sheets, the phone can
 * lay them on top of each other. Nothing is spelled out — the two sets of ticks
 * simply land on the same two blocks.
 */
export function SheetOverlayView() {
  const cols = [...BLOCK_COLS];
  const cw = 74, ch = 46, gap = 5, ox = 56, oy = 92;
  const gridW = cols.length * (cw + gap) - gap, gridH = BLOCK_ROWS.length * (ch + gap) - gap;
  const W = ox * 2 + gridW, H = oy + gridH + 74;
  const colX = (c: string) => ox + cols.indexOf(c as never) * (cw + gap);
  const rowY = (r: number) => oy + (r - 1) * (ch + gap);
  const tick = (id: string, color: string, dx: number, dy: number) => {
    const c = id[0], r = Number(id.slice(1));
    return <path key={color + id} d={`M${colX(c) + 18 + dx} ${rowY(r) + 26 + dy} l8 9 l19 -21`} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />;
  };
  useEffect(() => {
    findSecret('truth', '客席側の図と舞台側の図を、向きを揃えて重ねてみる。二人分のチェックは、同じ三つのブロックにぴたりと重なった。');
  }, []);
  return (
    <div className="paper" style={{ maxWidth: 640 }}>
      <h3>2枚のチェック表を重ねる</h3>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
        <rect x={ox + gridW * 0.12} y={26} width={gridW * 0.76} height="42" fill="#3b3d44" />
        <text x={ox + gridW / 2} y={54} textAnchor="middle" fill="#fff" fontSize="18" letterSpacing="5">STAGE</text>
        {cols.map((c) => BLOCK_ROWS.map((r) => (
          <g key={`${c}${r}`}>
            <rect x={colX(c)} y={rowY(r)} width={cw} height={ch} fill="none" stroke="#666" strokeWidth="1.3" />
            <text x={colX(c) + 5} y={rowY(r) + 15} fontSize="11.5" fill="#555">{c}{r}</text>
          </g>
        )))}
        {FOH_MARKS.map((id) => tick(id, '#c23a2b', -5, -3))}
        {STAGE_MARKS.map((id) => tick(id, '#2f6fd6', 7, 5))}
        <text x={ox} y={H - 30} fontSize="13.5" fill="#a33">■ 客席側（そのままの向き）</text>
        <text x={ox + 210} y={H - 30} fontSize="13.5" fill="#2f6fd6">■ 舞台側（向きを揃えて重ねた）</text>
      </svg>
    </div>
  );
}

// ------------------------------------------------------------ backstage docs
export function WhiteboardView() {
  const line = (t: string, color = '#1f2c55') => <div style={{ color, marginBottom: 10 }}>{t}</div>;
  return (
    <div className="paper" style={{ background: 'linear-gradient(135deg,#f7f8f8,#e3e6e8)', maxWidth: 720, border: '10px solid #b9bec4', borderRadius: 4 }}>
      <div className="hand" style={{ fontSize: 17, lineHeight: 1.75 }} data-testid="whiteboard">
        <div style={{ fontSize: 22, borderBottom: '2px solid #1f2c55', marginBottom: 12 }}>12月5日　撤収ボード</div>
        {line('【音響】終演アナウンスの回線、搬入口のスピーカーだけ本線（下手側）が断線。上手側の予備回線に振り替えています。客席とコンコースは通常どおり。 ― T', '#b3261e')}
        {line('【照明】Q48（暗転→明転）のフォーカスデータが、撤収作業中に消えました。蓄光テープの位置を見て組み直します。上手のリグは明日の朝に降ろします。')}
        {line('【舞台】蓄光テープをはがし忘れています → 明朝', '#1d6b3a')}
        {line('【搬出】2号車 積み込み完了／3号車 残りわずか')}
        {line('【無線】最終確認 23:21「5段目 D・E・F 異常なし」→ 全ブロック確認済み → 閉館シーケンス 23:30', '#b3261e')}
        <div className="tap" style={{ textAlign: 'right', fontSize: 15, color: '#c77d12', marginTop: 18 }}
          onClick={() => findSecret('sevenyears', 'ボードの隅に、誰かが小さく書き足している。「7年間、おつかれさまでした」──その横に、下手な太陽の絵。')} data-testid="secret-sevenyears">
          （隅に小さな落書き）☀
        </div>
      </div>
    </div>
  );
}

export function StageSheetView() {
  return (
    <div className="paper" style={{ maxWidth: 600 }}>
      <div className="clip" />
      <h3>退場確認（舞台側）12月5日</h3>
      <div className="small" style={{ marginBottom: 2 }}>※この図面は <b>舞台から見た向き</b> です</div>
      <SeatMap view="stage" letters="hand-wrong" marks={STAGE_MARKS} />
      <div className="hand">5段目 D・E・F 確認済み（23:21）→ 無線で報告</div>
      <div className="small" style={{ marginTop: 8 }}>ブロックの記号と段の番号は、あとから手書きで書き足されている。</div>
    </div>
  );
}

export function GlowRollView() {
  return (
    <div className="paper" style={{ maxWidth: 560 }}>
      <svg viewBox="0 0 400 150" style={{ width: '100%' }}>
        <circle cx="90" cy="75" r="62" fill="#d8e6c6" stroke="#8fa37a" strokeWidth="4" />
        <circle cx="90" cy="75" r="30" fill="#bba98e" />
        <rect x="150" y="54" width="230" height="40" fill="#d8e6c6" />
      </svg>
      <p style={{ fontSize: 16, lineHeight: 1.9, margin: 0 }}>
        <b>蓄光テープ（舞台用）</b><br />
        白色や青色の光を当てると、暗いところでよく光ります。<br />
        赤色やオレンジ色の光では、ほとんど光りません。
      </p>
      <p className="hand" style={{ fontSize: 15 }}>暗転中の立ち位置用。はがすのは明日！</p>
    </div>
  );
}

export function TruckListView() {
  const row = (done: boolean, t: string) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
      <span style={{ fontSize: 20, color: done ? '#1d6b3a' : '#999' }}>{done ? '☑' : '☐'}</span><span>{t}</span>
    </div>
  );
  return (
    <div className="paper" style={{ maxWidth: 640 }}>
      <div className="clip" />
      <h3>積み込みチェック表　12月5日</h3>
      <div className="small">
        機材はケースに貼ったテープの色で場所を管理しています。<br />
        <b>☑ ＝ 積み込み済み（もう館内にありません）／☐ ＝ まだ館内に残っています</b>
      </div>
      <div className="hand" style={{ marginTop: 10 }} data-testid="trucklist">
        <b>2号車</b>
        {row(true, '照明リグの機材〈青テープ〉×6')}
        {row(true, '照明リグの機材〈黄テープ〉×2')}
        <b>3号車</b>
        {row(true, '音響アンプ〈赤テープ〉×2')}
        {row(true, '音響アンプ〈青テープ〉×2')}
        {row(true, 'ケータリングの保温庫（レンタル返却）')}
        {row(false, '照明リグの機材〈赤テープ〉×6　← 明日の朝、吊り下ろしてから')}
      </div>
      <div className="small" style={{ marginTop: 12, borderTop: '1px dashed #bbb', paddingTop: 8 }}>
        ※ 音響・照明卓（FOH）と搬入口シャッターは会場の常設設備なので、この表には載りません。
      </div>
    </div>
  );
}

export function PaLogView() {
  return (
    <div className="paper">
      <h3>場内放送（録音）</h3>
      {PA_LINES.map((l) => <p key={l} style={{ margin: '4px 0' }}>{l}</p>)}
    </div>
  );
}
