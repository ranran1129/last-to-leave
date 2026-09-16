import { useEffect, useState } from 'react';
import { useGame, useSettings } from '../game/store';
import { setFlag } from '../game/engine';
import { sfx } from '../audio/audio';
import type { SceneId } from '../game/types';

export const PA_LINES = [
  '（録音）本日の公演は、すべて終了いたしました。',
  '規制退場のご案内です。係員の誘導に従い、順番にご退場ください。',
  'アリーナ C3・D3ブロックの皆さまは、6番ゲートからご退場ください。',
  '本日はご来場、まことにありがとうございました。',
];

const PA_SCENES: SceneId[] = ['arena', 'arenaback', 'arenadoor', 'stagefront', 'foh', 'lobby', 'gate', 'merch', 'flowers', 'dock'];

/** Recorded announcement loop after the PA routing is restored — subtitles are the visual channel for the audio. */
export function PAText({ scene }: { scene: SceneId }) {
  const on = useGame((s) => !!s.solved.p4 && !s.solved.meta);
  const { subtitles } = useSettings();
  const [i, setI] = useState(0);
  const active = on && PA_SCENES.includes(scene);
  useEffect(() => {
    if (!active) return;
    let k = 0;
    setI(0);
    sfx('pa');
    const id = window.setInterval(() => {
      k = (k + 1) % (PA_LINES.length + 1);
      if (k === PA_LINES.length) return; // short silence between loops
      if (k === 0) sfx('pa');
      setI(k);
      if (k === 2) setFlag('pa');
    }, 4200);
    return () => window.clearInterval(id);
  }, [active]);
  if (!active || !subtitles) return null;
  return <div className="pa-sub" aria-live="polite" data-testid="pa-sub">📢 {PA_LINES[i]}</div>;
}
