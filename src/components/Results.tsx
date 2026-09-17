import { useEffect } from 'react';
import { useGame, clearSave, replaceState, initialState } from '../game/store';
import { setAmbience } from '../audio/audio';
import { SECRETS } from '../game/secrets';

const fmt = (ms: number) => {
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function Results() {
  const s = useGame((x) => x);
  useEffect(() => { setAmbience('none'); clearSave(); }, []);
  const hints = Object.values(s.hints).reduce((a, b) => a + (b ?? 0), 0);
  const answers = Object.values(s.answers).filter(Boolean).length;
  return (
    <div className="results" data-testid="results">
      <div className="results-card">
        <div className="title-kicker">EXITED — EXIT 6</div>
        <h2 style={{ fontSize: 30, letterSpacing: '0.18em', margin: '8px 0 0' }}>LAST TO LEAVE</h2>
        <dl>
          <dt>CLEAR TIME</dt><dd data-testid="clear-time">{fmt(s.clearMs || s.playMs)}</dd>
          <dt>使用ヒント</dt><dd>{hints}</dd>
          <dt>答えを見た謎</dt><dd>{answers}</dd>
          <dt>撮った写真</dt><dd>{s.photos.length}</dd>
          <dt>見つけた小さな記憶</dt><dd>{s.secrets.length} / {SECRETS.length}</dd>
        </dl>
        <div className="memories">
          {SECRETS.map((x) => <span key={x.id} className={s.secrets.includes(x.id) ? 'got' : ''}>{s.secrets.includes(x.id) ? x.name : '？？？'}</span>)}
        </div>
        <p style={{ fontSize: 12, color: '#8c9298', lineHeight: 1.8 }}>
          この作品は非公式のファンメイド・フィクションです。<br />登場する設備・スタッフ・資料はすべて創作です。
        </p>
        <button className="btn primary" data-testid="back-title" onClick={() => replaceState(initialState())}>タイトルへ</button>
      </div>
    </div>
  );
}
