import { useEffect, useState } from 'react';
import { setState, useGame, flushSave } from '../game/store';
import { img } from '../game/assets';
import { CLOSEUPS } from '../closeups/registry';
import { PreshowThumb } from '../closeups/docs';
import { SCENES } from '../game/scenes';
import { setAmbience, playEndingMotif, sfx } from '../audio/audio';
import type { SceneId } from '../game/types';

/** Player-driven epilogue: outside → look back → phone photos → results. No auto-playing movie. */
export default function Ending() {
  const [step, setStep] = useState(0);
  const s = useGame((x) => x);
  useEffect(() => { setAmbience('outside'); }, []);
  useEffect(() => { if (step === 2) playEndingMotif(); sfx('step'); }, [step]);
  const next = () => {
    if (step < 3) setStep(step + 1);
    else { setState((x) => ({ ...x, phase: 'results' })); flushSave(); }
  };
  const photos: { src: string | null; label: string; thumb?: 'preshow' }[] = [
    { src: null, label: '16:38 ロビーの祝花', thumb: 'preshow' },
    { src: img('penlights'), label: '20:52 公演中' },
    ...s.photos.map((p) => ({
      src: p.subject.startsWith('scene:') ? SCENES[p.subject.slice(6) as SceneId].image(s) : null,
      label: `${p.at} ${p.subject.startsWith('scene:') ? p.label : CLOSEUPS[p.subject]?.title ?? p.label}`,
    })),
  ];
  return (
    <div className="ending" onClick={next} data-testid={`ending-${step}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {step < 2 && (
        <div className="frame" style={{ width: 'min(100vw, calc(100dvh * 16 / 9))' }}>
          <img className="scene-img scene-fade" key={step} src={img('outside')} alt="深夜の会場の外"
            style={{
              filter: step === 0 ? 'brightness(1.05) blur(1.2px)' : 'brightness(1.0)',
              transform: step === 0 ? 'scale(1.7) translateY(-16%)' : 'scale(1)',
              transition: 'transform 3.5s ease, filter 3.5s ease',
            }} />
          <div className="grain" /><div className="vignette" />
          <div className="ending-text" key={`t${step}`}>
            {step === 0 ? 'ゲートの外は、深夜の福岡だった。\n海からの風が、少しだけ冷たい。' : '振り返ると、さっきまでいた建物が\n静かにそこにあった。'}
          </div>
          <div style={{ position: 'absolute', right: 16, bottom: 12, fontSize: 12, color: '#8c9298' }}>{step === 0 ? 'タップで振り返る' : 'タップでスマホを見る'}</div>
        </div>
      )}
      {step >= 2 && (
        <div style={{ width: 'min(92vw, 420px)', maxHeight: '90dvh', overflowY: 'auto', background: '#0d1014', borderRadius: 30, padding: '20px 16px', border: '1px solid #2a2f36' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#9aa0a6', display: 'flex', justifyContent: 'space-between', padding: '0 8px 10px' }}>
            <span>00:{String(20 + Math.floor(s.playMs / 600000) % 30).padStart(2, '0')}</span><span style={{ color: '#34d27a' }}>4G</span>
          </div>
          <div className="photo-grid">
            {photos.map((p, i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', position: 'relative', background: '#1b2026' }}>
                {p.thumb === 'preshow'
                  ? <PreshowThumb />
                  : p.src
                    ? <img src={p.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <div className="thumb-doc">{p.label.split(' ').slice(1).join(' ')}</div>}
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, fontSize: 9.5, background: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>{p.label}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', lineHeight: 2, letterSpacing: '0.08em', margin: '22px 0 6px', fontSize: 15 }}>
            {step === 2 ? '電波が戻っていた。\n' : ''}
            {step === 2 ? <>ライブは終わった。<br />卒業セレモニーも、終わった。</> : <>それでも、あの夜あの場所にいた時間は<br />ここに、ちゃんと残っている。</>}
          </p>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#6d757d' }}>{step === 2 ? 'タップ' : 'タップで結果へ'}</div>
        </div>
      )}
    </div>
  );
}
