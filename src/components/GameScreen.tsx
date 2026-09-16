import { useEffect } from 'react';
import { useGame, useSettings } from '../game/store';
import { useUI, setUI } from '../game/ui';
import { SCENES } from '../game/scenes';
import { setAmbience } from '../audio/audio';
import { closeCloseup } from '../game/engine';
import SceneView from './SceneView';
import Inventory from './Inventory';
import Phone from './Phone';
import CloseupHost from './CloseupHost';
import Cinematic from './Cinematic';

export default function GameScreen() {
  const sceneId = useGame((s) => s.scene);
  const scene = SCENES[sceneId];
  const closeup = useUI((u) => u.closeup);
  const phoneOpen = useUI((u) => u.phoneOpen);
  useSettings();

  useEffect(() => { setAmbience(scene.ambience); }, [scene.ambience]);

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
      <div className="rotate-hint">横向きにすると遊びやすくなります</div>
      <div className="frame-wrap">
        <SceneView scene={scene} />
      </div>
      <Inventory />
      {closeup && <CloseupHost id={closeup} />}
      {phoneOpen && <Phone />}
      <Cinematic />
    </>
  );
}
