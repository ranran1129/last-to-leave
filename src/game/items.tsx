import type { ItemId, PenColor } from './types';

export const PEN_COLORS: Record<PenColor, { name: string; hex: string }> = {
  orange: { name: 'オレンジ', hex: '#ff8a2a' },
  white: { name: 'ホワイト', hex: '#f4f7ff' },
  sky: { name: 'そらいろ', hex: '#6cc6ff' },
  pink: { name: 'ピンク', hex: '#ff7fb8' },
  green: { name: 'グリーン', hex: '#5be08a' },
};

export const ITEMS: Record<ItemId, { name: string; desc: string }> = {
  ticket: { name: 'チケット', desc: '今日の公演のチケット。' },
  penlight: { name: 'ペンライト', desc: '最後の曲のときの色のまま、ずっと点いている。' },
  drum: { name: '電源ドラム', desc: 'オレンジ色の延長コードリール。物販のストック室にあった。' },
  silvertape: { name: '銀テープ', desc: '座席の下に落ちていた一本。' },
};

export function ItemIcon({ id, pen }: { id: ItemId; pen?: PenColor }) {
  switch (id) {
    case 'ticket':
      return (
        <svg viewBox="0 0 48 48" aria-hidden>
          <path d="M6 14h36v6a4 4 0 0 0 0 8v6H6v-6a4 4 0 0 0 0-8z" fill="#e9e2d0" stroke="#8b8577" />
          <path d="M31 15v18" stroke="#8b8577" strokeDasharray="2 2" />
          <rect x="10" y="19" width="16" height="3" fill="#7cc4ea" />
          <rect x="10" y="25" width="12" height="2" fill="#555" />
        </svg>
      );
    case 'penlight': {
      const c = PEN_COLORS[pen ?? 'orange'].hex;
      return (
        <svg viewBox="0 0 48 48" aria-hidden>
          <defs><radialGradient id="pg"><stop offset="0" stopColor={c} stopOpacity="0.9" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient></defs>
          <circle cx="30" cy="16" r="16" fill="url(#pg)" opacity="0.6" />
          <rect x="21" y="6" width="9" height="24" rx="4" transform="rotate(35 25 18)" fill={c} />
          <rect x="11" y="28" width="9" height="14" rx="2" transform="rotate(35 15 35)" fill="#2b2f36" stroke="#555" />
        </svg>
      );
    }
    case 'drum':
      return (
        <svg viewBox="0 0 48 48" aria-hidden>
          <circle cx="24" cy="24" r="17" fill="#e5762a" stroke="#8a3f10" strokeWidth="2" />
          <circle cx="24" cy="24" r="10" fill="#2a2a2a" />
          <circle cx="24" cy="24" r="4" fill="#e5762a" />
          <path d="M38 34c5 4 6 8 3 10" stroke="#222" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'silvertape':
      return (
        <svg viewBox="0 0 48 48" aria-hidden>
          <path d="M6 34c8-10 14 4 22-6s12-6 14-12" stroke="#d8dde3" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M6 34c8-10 14 4 22-6s12-6 14-12" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.7" />
        </svg>
      );
  }
}
