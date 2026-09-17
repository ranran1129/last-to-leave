import type { ItemId, PenColor } from './types';
import { img } from './assets';

export const PEN_COLORS: Record<PenColor, { name: string; hex: string; filter: string }> = {
  orange: { name: 'オレンジ', hex: '#ff8a2a', filter: 'none' },
  white: { name: 'ホワイト', hex: '#f4f7ff', filter: 'saturate(0.12) brightness(1.5)' },
  sky: { name: 'そらいろ', hex: '#6cc6ff', filter: 'hue-rotate(168deg) saturate(1.1) brightness(1.05)' },
  pink: { name: 'ピンク', hex: '#ff7fb8', filter: 'hue-rotate(295deg) saturate(1.1) brightness(1.05)' },
  green: { name: 'グリーン', hex: '#5be08a', filter: 'hue-rotate(78deg) saturate(1.05) brightness(1.05)' },
};

export const ITEMS: Record<ItemId, { name: string; desc: string }> = {
  ticket: { name: 'チケット', desc: '今日の公演のチケット。' },
  penlight: { name: 'ペンライト', desc: '最後の曲で使った色のまま、まだ点いている。' },
  drum: { name: '電源ドラム', desc: 'オレンジ色の延長コードリール。物販のストック室にあった。' },
  silvertape: { name: '銀テープ', desc: '客席に落ちていた一本。' },
};

const SRC: Record<ItemId, 'prop_ticket' | 'prop_penlight' | 'prop_drum' | 'prop_tape'> = {
  ticket: 'prop_ticket', penlight: 'prop_penlight', drum: 'prop_drum', silvertape: 'prop_tape',
};

/** 実写素材を切り抜いたアイコン。ペンライトだけは色替えをフィルターで表現する */
export function ItemIcon({ id, pen }: { id: ItemId; pen?: PenColor }) {
  const style = id === 'penlight'
    ? { filter: `${PEN_COLORS[pen ?? 'orange'].filter} drop-shadow(0 0 6px ${PEN_COLORS[pen ?? 'orange'].hex}88)` }
    : undefined;
  return <img src={img(SRC[id])} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', ...style }} />;
}
