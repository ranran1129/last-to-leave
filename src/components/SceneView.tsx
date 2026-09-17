import type { ActionCtx, Hotspot, SceneDef } from '../game/types';
import { useGame, getState } from '../game/store';
import { useUI, setUI, say } from '../game/ui';
import { go, openCloseup, takeItem, setFlag, findSecret, clockText } from '../game/engine';
import { img } from '../game/assets';
import { SceneOverlay } from '../scenes/overlays';
import { ITEMS } from '../game/items';
import { PAText } from './PAText';

const ARROWS: Record<string, string> = {
  left: 'M28 8 L12 24 L28 40', right: 'M20 8 L36 24 L20 40', up: 'M8 30 L24 14 L40 30',
  down: 'M8 18 L24 34 L40 18', back: 'M8 18 L24 34 L40 18',
};

export function makeCtx(): ActionCtx {
  const s = getState();
  return {
    s, go, open: openCloseup, say: (t) => say(t), take: takeItem, setFlag,
    secret: findSecret, held: s.heldItem,
  };
}

function HotspotButton({ h }: { h: Hotspot }) {
  const [x, y, w, hh] = h.rect;
  return (
    <button
      className={`hs ${h.kind}`}
      style={{
        left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${hh}%`,
        // 位置合わせ用: window.__ltl.hotspots(true) で当たり判定を可視化する（開発時のみ）
        ...((window as any).__ltlDebugHotspots ? { outline: '2px solid #ff3d7f', background: 'rgba(255,61,127,0.14)' } : {}),
      }}
      aria-label={h.label}
      data-testid={`hs-${h.id}`}
      onClick={(e) => { e.stopPropagation(); h.onClick(makeCtx()); }}
    >
      {h.arrow && (
        <svg className="arrow" viewBox="0 0 48 48" aria-hidden>
          <path d={ARROWS[h.arrow]} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="hs-label">{h.label}</span>
    </button>
  );
}

export default function SceneView({ scene }: { scene: SceneDef }) {
  const s = useGame((x) => x);
  const caption = useUI((u) => u.caption);
  const captionKey = useUI((u) => u.captionKey);
  const src = scene.image(s);
  const filter = scene.filter?.(s) ?? 'none';
  const hotspots = scene.hotspots.filter((h) => !h.visible || h.visible(s));

  return (
    <div className={`frame ${s.heldItem ? 'holding' : ''}`} data-testid={`scene-${scene.id}`} onClick={() => {
      if (s.heldItem) { say(`${ITEMS[s.heldItem].name}は、そこには使えなさそうだ。`); }
    }}>
      <img key={scene.id} className={`scene-img scene-fade ${scene.flip ? 'flip' : ''}`} src={src} style={{ filter }} alt={scene.name} draggable={false} />
      <SceneOverlay id={scene.id} s={s} />
      <div className="grain" />
      <div className="vignette" />
      {hotspots.map((h) => <HotspotButton key={h.id} h={h} />)}
      <div className="hud-top">
        <div className="place">{scene.name}<small>{clockText(s)}</small></div>
        <button className="phone-btn" data-testid="phone-btn" onClick={(e) => { e.stopPropagation(); setUI({ phoneOpen: true }); }}>
          <svg viewBox="0 0 24 24" aria-hidden><rect x="6" y="2" width="12" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="18" r="1.2" fill="currentColor" /></svg>
          スマホ
        </button>
      </div>
      <PAText scene={scene.id} />
      {caption && <div key={captionKey} className="caption" data-testid="caption">{caption}</div>}
    </div>
  );
}
