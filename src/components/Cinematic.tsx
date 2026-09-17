import { useEffect } from 'react';
import { useUI, setUI } from '../game/ui';
import { sfx } from '../audio/audio';

const SEQ: Record<string, { lines: string[]; sounds: [number, Parameters<typeof sfx>[0]][]; ms: number }> = {
  meta: {
    lines: ['制御盤の奥で、リレーが順に噛み合っていく。', '搬入口の照明が点く。', '遠くの廊下、客席、コンコース──', 'ひとつずつ、明かりが戻っていく。'],
    sounds: [[0, 'relay'], [600, 'relay'], [1200, 'power'], [2600, 'relay'], [3400, 'breaker'], [4300, 'relay'], [5200, 'pa'], [6300, 'unlock']],
    ms: 7600,
  },
  p6: {
    lines: ['低いうなりとともに、盤に電気が戻る。', '背後でシャッターのモーターが回り始めた。'],
    sounds: [[0, 'breaker'], [300, 'power'], [1500, 'motor']],
    ms: 4600,
  },
};

export default function Cinematic() {
  const id = useUI((u) => u.cinematic);
  useEffect(() => {
    if (!id || !SEQ[id]) return;
    const seq = SEQ[id];
    const timers = seq.sounds.map(([t, s]) => window.setTimeout(() => sfx(s), t));
    timers.push(window.setTimeout(() => setUI({ cinematic: null }), seq.ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [id]);
  if (!id || !SEQ[id]) return null;
  const seq = SEQ[id];
  return (
    <div className="cinematic" data-testid={`cinematic-${id}`}>
      <div className="cine-dim" style={{ animationDuration: `${seq.ms}ms` }} />
      <div className="cine-lines">
        {seq.lines.map((l, i) => <div key={i} style={{ animationDelay: `${0.3 + i * (seq.ms / 1000 - 1.5) / seq.lines.length}s` }}>{l}</div>)}
      </div>
    </div>
  );
}
