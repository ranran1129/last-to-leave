import { useEffect } from 'react';
import { useGame, useSettings } from '../game/store';
import { useUI, setUI } from '../game/ui';
import { SCENES } from '../game/scenes';
import { setAmbience, setMusic } from '../audio/audio';
import { closeCloseup } from '../game/engine';
import SceneView from './SceneView';
import Inventory from './Inventory';
import Phone from './Phone';
import CloseupHost from './CloseupHost';
import Cinematic from './Cinematic';

export default function GameScreen() {
  const s = useGame((x) => x);
  const scene = SCENES[s.scene];
  const closeup = useUI((u) => u.closeup);
  const phoneOpen = useUI((u) => u.phoneOpen);
  useSettings();

  useEffect(() => { setAmbience(scene.ambience); }, [scene.ambience]);
  useEffect(() => {
    // バックステージだけ、少し低く沈んだ曲に切り替える
    setMusic(scene.ambience === 'backstage' || scene.ambience === 'dock' ? 'backstage' : 'hall');
  }, [scene.ambience]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (closeup) closeCloseup();
        else if (phoneOpen) setUI({ phoneOpen: false });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeup, phoneOpen]);

  return (
    <>
      <div className="frame-wrap">
        {/* 画面比が 16:9 より横長のとき、左右の余白をその場面のぼかしで埋める（全画面に見せる） */}
        <div className="stage-bg" style={{ backgroundImage: `url(${scene.image(s)})` }} aria-hidden />
        <SceneView scene={scene} />
      </div>
      <Inventory />
      {closeup && <CloseupHost id={closeup} />}
      {phoneOpen && <Phone />}
      <Cinematic />
    </>
  );
}
