import { useEffect } from 'react';
import { useGame, useSettings, getState, flushSave, setState } from '../game/store';
import { useUI, setUI } from '../game/ui';
import { tick, openCloseup } from '../game/engine';
import { ensureAudio, setVolume, setMusic, setMusicVolume, setMusicEnabled } from '../audio/audio';
import { preloadAll } from '../game/assets';
import { useState } from 'react';
import TitleScreen from './TitleScreen';
import Intro from './Intro';
import GameScreen from './GameScreen';
import Ending from './Ending';
import Results from './Results';

/**
 * スマホを縦で開いたときだけ出る案内。横向きにすると CSS 側で自動的に消える。
 * （どうしても縦で遊びたい人のために、閉じるボタンも用意する）
 */
function RotateGate() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rotate-gate" data-testid="rotate-gate">
      <svg viewBox="0 0 48 48" aria-hidden>
        <rect x="14" y="4" width="20" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="24" cy="39" r="1.6" fill="currentColor" />
      </svg>
      <p>スマホを横向きにしてください<br /><small>画面いっぱいで遊べます</small></p>
      <button className="btn" onClick={() => setDismissed(true)}>このまま縦画面で続ける</button>
    </div>
  );
}

export default function App() {
  const phase = useGame((s) => s.phase);
  const settings = useSettings();
  const flash = useUI((u) => u.flash);
  const toast = useUI((u) => u.toast);

  useEffect(() => { setVolume(settings.volume); }, [settings.volume]);
  useEffect(() => {
    setMusicVolume(settings.musicVolume);
    setMusicEnabled(settings.musicVolume > 0);
  }, [settings.musicVolume]);
  useEffect(() => {
    setMusic(phase === 'title' || phase === 'intro' ? 'title' : phase === 'ending' || phase === 'results' ? 'ending' : 'hall');
  }, [phase]);
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
      ...(import.meta.env.DEV ? {
        patch: (p: any) => setState((s) => ({ ...s, ...p })),
        open: (id: string) => openCloseup(id),
        hotspots: (on: boolean) => { (window as any).__ltlDebugHotspots = on; setState((s) => ({ ...s })); },
      } : {}),
    };
  }, []);

  return (
    <div className={`app ${settings.reduceMotion ? 'reduce-motion' : ''} ${settings.tapMarks ? 'tap-marks' : ''}`}>
      <RotateGate />
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
