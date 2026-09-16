import { useEffect } from 'react';
import { useGame, useSettings, getState, flushSave, setState } from '../game/store';
import { useUI, setUI } from '../game/ui';
import { tick } from '../game/engine';
import { ensureAudio, setVolume } from '../audio/audio';
import { preloadAll } from '../game/assets';
import TitleScreen from './TitleScreen';
import Intro from './Intro';
import GameScreen from './GameScreen';
import Ending from './Ending';
import Results from './Results';

export default function App() {
  const phase = useGame((s) => s.phase);
  const settings = useSettings();
  const flash = useUI((u) => u.flash);
  const toast = useUI((u) => u.toast);

  useEffect(() => { setVolume(settings.volume); }, [settings.volume]);
  useEffect(() => { preloadAll(); }, []);

  useEffect(() => {
    const unlock = () => ensureAudio();
    const save = () => { try { flushSave(); } catch { /* ignore */ } };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', save);
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) tick(Math.min(5000, now - last));
      last = now;
    }, 1000);
    return () => {
      window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock);
      window.removeEventListener('beforeunload', save); window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', save);
      window.clearInterval(id);
    };
  }, []);

  // expose a tiny debug/test hook (used by E2E tests)
  useEffect(() => {
    (window as any).__ltl = {
      getState,
      // dev-only helper used by the visual QA pass
      ...(import.meta.env.DEV ? { patch: (p: any) => setState((s) => ({ ...s, ...p })) } : {}),
    };
  }, []);

  return (
    <div className={`app ${settings.reduceMotion ? 'reduce-motion' : ''}`}>
      {phase === 'title' && <TitleScreen />}
      {phase === 'intro' && <Intro />}
      {phase === 'play' && <GameScreen />}
      {phase === 'ending' && <Ending />}
      {phase === 'results' && <Results />}
      {flash > 0 && <div key={flash} className="flash" onAnimationEnd={() => setUI({})} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
