import { useState } from 'react';
import { newGame, continueGame, resetGame } from '../game/engine';
import { hasContinue } from '../game/store';
import { img } from '../game/assets';
import { ensureAudio, sfx } from '../audio/audio';

export default function TitleScreen() {
  const [canContinue, setCanContinue] = useState(hasContinue());
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="title-screen">
      <img className="title-bg" src={img('arena')} alt="" />
      <div className="vignette" />
      <div className="title-inner">
        <div className="title-kicker">2024.12.05 — 23:47 — MARINE MESSE FUKUOKA HALL A</div>
        <h1 className="title-main">LAST TO LEAVE</h1>
        <div className="title-sub">終演後の、最後のひとり</div>
        <div className="title-menu">
          <button className="btn primary" data-testid="new-game" onClick={() => { ensureAudio(); sfx('click'); newGame(); }}>NEW GAME</button>
          <button className="btn" data-testid="continue" disabled={!canContinue} onClick={() => { ensureAudio(); sfx('click'); continueGame(); }}>CONTINUE</button>
          {!confirmReset ? (
            <button className="btn warn" data-testid="reset" disabled={!canContinue} onClick={() => setConfirmReset(true)}>RESET</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn warn" data-testid="reset-confirm" onClick={() => { resetGame(); setCanContinue(false); setConfirmReset(false); }}>セーブを消す</button>
              <button className="btn" onClick={() => setConfirmReset(false)}>やめる</button>
            </div>
          )}
        </div>
      </div>
      <div className="title-foot">
        非公式ファン作品（フィクション）。実在の公演を舞台にしていますが、登場する設備・スタッフ・資料・会場の非公開エリアはすべて創作です。<br />
        音声・画像に公式素材は使用していません。ヘッドホン推奨／進行は自動保存されます。
      </div>
    </div>
  );
}
