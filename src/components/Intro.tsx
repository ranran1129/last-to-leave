import { useEffect, useState } from 'react';
import { startPlay } from '../game/engine';
import { sfx } from '../audio/audio';

const LINES = [
  ['2024年12月5日　23時47分', 'マリンメッセ福岡　A館'],
  ['最後の規制退場のアナウンスを、', 'たしかに聞いた気がする。'],
  ['立ち上がれないまま、', 'ステージの方をずっと見ていた。'],
  ['気付くと、客席の明かりは', 'ほとんど落ちていた。'],
];

export default function Intro() {
  const [i, setI] = useState(0);
  useEffect(() => { sfx('look'); }, [i]);
  const next = () => (i < LINES.length - 1 ? setI(i + 1) : startPlay());
  return (
    <div className="intro" onClick={next} data-testid="intro" role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && next()}>
      <div key={i}>
        {LINES[i].map((l, k) => <p key={k} style={{ animationDelay: `${k * 0.7}s` }}>{l}</p>)}
      </div>
      <div className="tap-next">クリック / タップで進む</div>
      <button className="btn" style={{ position: 'absolute', top: 16, right: 16, fontSize: 12 }} onClick={(e) => { e.stopPropagation(); startPlay(); }}>スキップ</button>
    </div>
  );
}
