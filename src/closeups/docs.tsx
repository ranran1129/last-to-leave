import { useGame } from '../game/store';
import { img } from '../game/assets';
import { BLOCK_COLS, BLOCK_ROWS, MERCH_NOTES, PLAYER_SEAT } from '../game/data';
import { findSecret, setPenColor } from '../game/engine';
import { PEN_COLORS, ITEMS } from '../game/items';
import type { PenColor } from '../game/types';
import { PA_LINES } from '../components/PAText';

export interface ViewProps { photo?: boolean }

// ------------------------------------------------------------ helpers
function SeatMap({ view, marks = [], letters = 'print', note }: {
  view: 'audience' | 'stage'; marks?: string[]; letters?: 'print' | 'hand-wrong' | 'none'; note?: string;
}) {
  // audience view: stage on top, A..D left→right. stage view: stage at bottom.
  const W = 420, H = 300, cw = 80, ch = 52, ox = 50, oy = view === 'audience' ? 78 : 30;
  const cols = [...BLOCK_COLS];
  const colX = (c: string) => {
    const i = cols.indexOf(c as never);
    return ox + (view === 'audience' ? i : 3 - i) * (cw + 5);
  };
  const rowY = (r: number) => (view === 'audience' ? oy + (r - 1) * (ch + 5) : oy + (3 - r) * (ch + 5));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '6px auto' }}>
      <rect x={ox} y={view === 'audience' ? 14 : 214} width={335} height={46} fill="#3b3d44" />
      <text x={ox + 167} y={view === 'audience' ? 44 : 244} textAnchor="middle" fill="#fff" fontSize="20" letterSpacing="6">STAGE</text>
      {cols.map((c) => BLOCK_ROWS.map((r) => {
        const id = `${c}${r}`;
        return (
          <g key={id}>
            <rect x={colX(c)} y={rowY(r)} width={cw} height={ch} fill="none" stroke="#555" strokeWidth="1.5" />
            {marks.includes(id) && (
              <path d={`M${colX(c) + 24} ${rowY(r) + 28} l10 10 l20 -22`} stroke="#c23a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      }))}
      {letters === 'print' && cols.map((c) => BLOCK_ROWS.map((r) => (
        <text key={`t${c}${r}`} x={colX(c) + 6} y={rowY(r) + 17} fontSize="13" fill="#444">{c}{r}</text>
      )))}
      {letters === 'hand-wrong' && ['A', 'B', 'C', 'D'].map((c, i) => (
        <text key={c} x={ox + i * (cw + 5) + cw / 2} y={oy - 8} textAnchor="middle" fontSize="22" fill="#1f2c55" fontFamily="var(--hand)">{c}</text>
      ))}
      {letters === 'hand-wrong' && [3, 2, 1].map((r, i) => (
        <text key={r} x={ox - 18} y={oy + i * (ch + 5) + 34} textAnchor="middle" fontSize="20" fill="#1f2c55" fontFamily="var(--hand)">{r}</text>
      ))}
      {note && <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#666">{note}</text>}
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
            <div style={{ fontSize: 14 }}>2024.12.05（木）　マリンメッセ福岡A館</div>
            <div style={{ marginTop: 14, fontSize: 13, color: '#555' }}>座席</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.04em' }} data-testid="ticket-seat">
              アリーナ {PLAYER_SEAT.block}ブロック {PLAYER_SEAT.row}列 {PLAYER_SEAT.seat}番
            </div>
          </div>
          <div style={{ borderLeft: '2px dashed #b5ad98', paddingLeft: 14, fontSize: 12, color: '#555', lineHeight: 1.7 }}>
            入場済<br />16:21<br /><span style={{ fontSize: 10 }}>※このチケットは画面表示を印刷したものではありません（ゲーム内の架空デザイン）</span>
          </div>
        </div>
      </div>
      <div className="paper" style={{ padding: '16px 22px' }}>
        <div className="small" style={{ fontWeight: 700 }}>裏面　アリーナ座席図（客席から見た図）</div>
        <SeatMap view="audience" note="※ブロックの区切りは会場・公演により異なります" />
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
    <div className="paper" style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 400 260" style={{ width: '100%', maxWidth: 380 }}>
        <circle cx="200" cy="130" r="110" fill="#e5762a" stroke="#7a3a0e" strokeWidth="6" />
        <circle cx="200" cy="130" r="66" fill="#222" />
        {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx="200" cy="130" r={70 + i * 4} fill="none" stroke="#111" strokeWidth="2" opacity="0.6" />)}
        <circle cx="200" cy="130" r="22" fill="#e5762a" />
        <text x="200" y="138" textAnchor="middle" fontSize="16" fill="#222">30m</text>
      </svg>
      <p className="hand">物販 照明用<br />（使ったら巻いて戻してね）</p>
    </div>
  );
}

export function SilverTapeView() {
  return (
    <div className="paper" style={{ background: 'linear-gradient(180deg,#d9dee4,#aab2bb 50%,#e7ebef)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', letterSpacing: '0.25em', fontSize: 18, color: '#5b6570', padding: '18px 0' }}>
        ✦ THANK YOU FOR THE MAGICAL DAYS ✦ THANK YOU FOR
      </div>
      <p className="small">発射された銀テープの一本。誰にも拾われずに、座席の下に残っていた。</p>
    </div>
  );
}

// ------------------------------------------------------------ arena
export function Announce6View() {
  return (
    <div className="paper" style={{ maxWidth: 620 }}>
      <div className="clip" />
      <h3>規制退場 案内原稿 ⑥（最終）</h3>
      <p style={{ fontSize: 17, lineHeight: 2.1, margin: '6px 0 12px' }} data-testid="announce-text">
        大変長らくお待たせいたしました。<br />最後のご案内です。<br />
        アリーナ、<u>ステージからいちばん遠い列</u>の、<br /><u>上手側のブロック</u>のお客様、ご退場ください。<br />
        お忘れ物のないよう、お手元をご確認ください。
      </p>
      <div className="hand" style={{ textAlign: 'right' }}>23:02 読了　→ 最終確認は客席側／舞台側で分担</div>
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
      <h3>退場確認（客席側）12/5</h3>
      <SeatMap view="audience" marks={['A1', 'B1', 'C1', 'D1', 'A2', 'B2', 'C2', 'D2', 'A3', 'B3']} />
      <div className="hand">
        1列目・2列目 → 全区画OK（22:58）<br />
        3列目 A3・B3 確認OK（23:19）<br />
        C・D は舞台側さんが見てくれるとのこと → 無線でOKもらう
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
          <text x="500" y="150" textAnchor="middle" fontSize="44" fill="#39e27f" className="mono">GATE 6  OPEN</text>
          <text x="500" y="210" textAnchor="middle" fontSize="26" fill="#39e27f">６番ゲート　開放中</text>
        </>
      ) : (
        <>
          <text x="500" y="150" textAnchor="middle" fontSize="40" fill="#ff5a3c" className="mono">CLOSED</text>
          <text x="500" y="210" textAnchor="middle" fontSize="26" fill="#ff5a3c">閉館処理中　全ゲート施錠</text>
        </>
      )}
      <text x="500" y="320" textAnchor="middle" fontSize="20" fill="#999">ゲート 1　2　3　4　5　6</text>
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
      <svg viewBox="0 0 1600 900" className="device">
        <PreshowComposite />
      </svg>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', margin: '8px 0 0' }}>16:38　入場してすぐに撮った、ロビーの祝花（人がたくさんいて、足もとは写っていない）</p>
    </div>
  );
}

import { STANDS, PRESHOW_ORDER } from '../game/data';
export const standImg = (id: string) => img(({ S1: 'stand_orange', S2: 'stand_white', S3: 'stand_sky', S4: 'stand_yellow', S5: 'stand_orange2' } as const)[id as 'S1']);
export const HEIGHT_SCALE = { tall: 1, mid: 0.8, short: 0.62 };
/** intrinsic width/height of each cut-out so a given drawn height is exact */
export const STAND_AR: Record<string, number> = { S1: 0.517, S2: 0.473, S3: 0.563, S4: 0.505, S5: 0.508 };

export function PreshowComposite() {
  return (
    <g>
      <image href={img('flowers')} x="0" y="0" width="1600" height="900" style={{ filter: 'brightness(1.5) saturate(1.1) sepia(0.15)' }} />
      {/* entrance glass on the left */}
      <rect x="0" y="60" width="150" height="560" fill="#cfe6f5" opacity="0.35" />
      <text x="75" y="120" textAnchor="middle" fontSize="26" fill="#fff" opacity="0.9">入口 →</text>
      {PRESHOW_ORDER.map((id, i) => {
        const st = STANDS.find((x) => x.id === id)!;
        const k = HEIGHT_SCALE[st.height];
        const h = 700 * k, w = h * STAND_AR[id];
        const cx = 330 + i * 250;
        return <image key={id} href={standImg(id)} x={cx - w / 2} y={830 - h} width={w} height={h} />;
      })}
      {/* crowd in front hides the vases and cards */}
      <defs>
        <filter id="blurCrowd"><feGaussianBlur stdDeviation="14" /></filter>
        <linearGradient id="crowdG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1c1714" stopOpacity="0" /><stop offset="0.25" stopColor="#1c1714" stopOpacity="0.96" /><stop offset="1" stopColor="#0e0b0a" /></linearGradient>
      </defs>
      <g filter="url(#blurCrowd)">
        {/* back row of heads, then the solid mass of the crowd in front of the vases */}
        {Array.from({ length: 13 }).map((_, i) => (
          <g key={`b${i}`} fill={i % 2 ? '#2e2622' : '#3a2f28'}>
            <circle cx={60 + i * 128} cy={520 + (i % 3) * 16} r="34" />
            <ellipse cx={60 + i * 128} cy={600 + (i % 3) * 16} rx="64" ry="52" />
          </g>
        ))}
        {Array.from({ length: 15 }).map((_, i) => (
          <g key={`f${i}`} fill={i % 2 ? '#1d1815' : '#272019'}>
            <circle cx={10 + i * 112 + (i % 2) * 22} cy={586 + (i % 4) * 20} r="42" />
            <ellipse cx={10 + i * 112 + (i % 2) * 22} cy={690 + (i % 4) * 20} rx="78" ry="66" />
          </g>
        ))}
        <rect x="0" y="690" width="1600" height="210" fill="url(#crowdG)" />
      </g>
      <rect x="0" y="0" width="1600" height="900" fill="#ffcf9a" opacity="0.07" />
    </g>
  );
}

/** square crop of the pre-show photo for the phone's photo roll */
export function PreshowThumb() {
  return (
    <svg viewBox="120 120 820 700" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <PreshowComposite />
    </svg>
  );
}

export function PenlightsPhotoView() {
  return (
    <div style={{ width: '100%' }}>
      <img src={img('penlights')} className="device" alt="公演中の客席" />
      <p style={{ textAlign: 'center', fontSize: 13, color: '#aaa', margin: '8px 0 0' }}>20:52　公演中。ブレていて、ほとんど光しか写っていない。</p>
    </div>
  );
}

// ------------------------------------------------------------ backstage docs
export function WhiteboardView() {
  const line = (t: string, color = '#1f2c55') => <div style={{ color, marginBottom: 10 }}>{t}</div>;
  return (
    <div className="paper" style={{ background: 'linear-gradient(135deg,#f7f8f8,#e3e6e8)', maxWidth: 720, border: '10px solid #b9bec4', borderRadius: 4 }}>
      <div className="hand" style={{ fontSize: 17, lineHeight: 1.75 }} data-testid="whiteboard">
        <div style={{ fontSize: 22, borderBottom: '2px solid #1f2c55', marginBottom: 12 }}>12/5　撤収ボード</div>
        {line('【音響】終演アナウンス回線、搬入口のスピーカーだけ本線（下手側）が断線。上手の予備回線に逃がしてます。客席・ロビーは通常どおり。 ― T', '#b3261e')}
        {line('【照明】Q48（暗転→明転）のフォーカス、撤収中にデータ飛んだ…。蓄光の位置で組み直し予定。上手リグは明朝おろし。')}
        {line('【舞台】蓄光テープ、はがし忘れあり → 明朝', '#1d6b3a')}
        {line('【搬出】TRK2 完了／TRK3 残りわずか')}
        {line('【無線】最終確認 23:21「C・D OK」→ 全区画OK → 閉館シーケンス 23:30', '#b3261e')}
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
      <h3>退場確認（舞台側）12/5</h3>
      <div className="small" style={{ marginBottom: 2 }}>※この図は <b>舞台から見た向き</b> です（図面係）</div>
      <SeatMap view="stage" letters="hand-wrong" marks={['A3', 'B3']} />
      <div className="hand">3列目 C・D 確認OK（23:21）→ 無線で報告</div>
      <div className="small" style={{ marginTop: 8 }}>A〜D と列番号は手書きで書き足されている。</div>
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
        白・青系の光を当てると、暗闇でよく光ります。<br />
        赤・橙系の光では、ほとんど光りません。
      </p>
      <p className="hand" style={{ fontSize: 15 }}>暗転中の立ち位置用。はがすの明日！</p>
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
      <h3>積込チェック 12/5</h3>
      <div className="small">機材ケースはテープの色で管理</div>
      <div className="hand" style={{ marginTop: 10 }} data-testid="trucklist">
        <b>TRK2</b>
        {row(true, '照明ケース〈青テープ〉×6')}
        {row(true, '照明ケース〈黄テープ〉×2')}
        <b>TRK3</b>
        {row(true, '音響アンプラック〈赤テープ〉×2')}
        {row(true, '音響アンプラック〈青テープ〉×2')}
        {row(true, 'ケータリング保温庫（返却）')}
        {row(false, '照明ケース〈赤テープ〉×6　← 明朝 吊り下ろし後')}
      </div>
    </div>
  );
}

export function TruckChalkView() {
  return (
    <svg viewBox="0 0 1000 420" className="device">
      <image href={img('dock')} x="-420" y="-250" width="1800" height="1012" style={{ filter: 'brightness(0.7)' }} />
      <rect x="0" y="0" width="1000" height="420" fill="rgba(0,0,0,0.35)" />
      <text x="500" y="230" textAnchor="middle" fontSize="44" fill="#f3f1ea" opacity="0.8" fontFamily="var(--hand)" transform="rotate(-3 500 230)">また、どこかの会場で</text>
    </svg>
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
