import { useState } from 'react';
import { useGame, useSettings, setSettings, flushSave } from '../game/store';
import { useUI, setUI } from '../game/ui';
import { MEMOS } from '../game/memos';
import { PUZZLES, puzzleStatus } from '../game/puzzles';
import { useHint, viewAnswer, clockText, takePhoto, resetGame } from '../game/engine';
import { CLOSEUPS } from '../closeups/registry';
import { PreshowThumb } from '../closeups/docs';
import { SCENES } from '../game/scenes';
import { img } from '../game/assets';
import type { SceneId } from '../game/types';
import { replaceState, initialState } from '../game/store';

const TABS = [
  { id: 'camera', label: 'カメラ', icon: 'M4 7h4l2-2h4l2 2h4v12H4z M12 9.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7' },
  { id: 'photos', label: '写真', icon: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4' },
  { id: 'memo', label: 'メモ', icon: 'M6 3h9l3 3v15H6z M9 9h6 M9 13h6 M9 17h4' },
  { id: 'hints', label: 'ヒント', icon: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11' },
  { id: 'settings', label: '設定', icon: 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2' },
] as const;

export default function Phone() {
  const tab = useUI((u) => u.phoneTab);
  const s = useGame((x) => x);
  return (
    <div className="phone" role="dialog" aria-label="スマートフォン" data-testid="phone">
      <div className="phone-status">
        <span>{clockText(s)}</span>
        <span className="no-signal">圏外</span>
        <span>42%</span>
      </div>
      <button className="close-x" aria-label="閉じる" data-testid="phone-close" onClick={() => setUI({ phoneOpen: false })}>×</button>
      <div className="phone-body">
        {tab === 'camera' && <CameraTab scene={s.scene} />}
        {tab === 'photos' && <PhotosTab />}
        {tab === 'memo' && <MemoTab />}
        {tab === 'hints' && <HintsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
      <nav className="phone-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} data-testid={`tab-${t.id}`} onClick={() => setUI({ phoneTab: t.id })}>
            <svg viewBox="0 0 24 24" aria-hidden><path d={t.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function CameraTab({ scene }: { scene: SceneId }) {
  const def = SCENES[scene];
  const s = useGame((x) => x);
  return (
    <>
      <h4>カメラ</h4>
      <div className="camera-view">
        <img src={def.image(s)} style={{ filter: def.filter?.(s), transform: def.flip ? 'scaleX(-1)' : undefined }} alt="" />
      </div>
      <button className="shutter" aria-label="撮影" onClick={() => takePhoto(`scene:${scene}`, def.name)} />
      <p style={{ fontSize: 12, color: '#8a939c', lineHeight: 1.6 }}>
        資料や装置を拡大しているときは、画面下の「撮影」でそれを写真に残せます。写真は「写真」からいつでも見返せます。
      </p>
    </>
  );
}

function PhotosTab() {
  const photos = useGame((s) => s.photos);
  const s = useGame((x) => x);
  const open = (subject: string) => {
    if (subject.startsWith('scene:')) { setUI({ photoView: subject }); return; }
    setUI({ phoneOpen: false, closeup: subject, closeupFromPhoto: true });
  };
  const viewing = useUI((u) => u.photoView);
  if (viewing) {
    const sid = viewing.slice(6) as SceneId;
    const def = SCENES[sid];
    return (
      <>
        <h4>{def.name}</h4>
        <div className="camera-view"><img src={def.image(s)} style={{ filter: def.filter?.(s), transform: def.flip ? 'scaleX(-1)' : undefined }} alt="" /></div>
        <button className="btn" style={{ marginTop: 12 }} onClick={() => setUI({ photoView: null })}>一覧に戻る</button>
      </>
    );
  }
  const canOverlay = ['fohsheet', 'stageSheet'].every((k) => photos.some((p) => p.subject === k));
  return (
    <>
      <h4>写真</h4>
      {canOverlay && (
        <button className="btn" style={{ width: '100%', marginBottom: 10, fontSize: 13 }} data-testid="overlay-sheets"
          onClick={() => setUI({ phoneOpen: false, closeup: 'sheetOverlay', closeupFromPhoto: true })}>
          2枚のチェック表を重ねてみる
        </button>
      )}
      <div className="photo-grid">
        <button onClick={() => setUI({ phoneOpen: false, closeup: 'preshow', closeupFromPhoto: true })} data-testid="photo-preshow">
          <PreshowThumb />
          <span>16:38 コンコースの祝花</span>
        </button>
        <button onClick={() => setUI({ phoneOpen: false, closeup: 'penlights', closeupFromPhoto: true })}>
          <img src={img('penlights')} alt="" />
          <span>20:52 公演中</span>
        </button>
        {photos.map((p) => (
          <button key={p.id} onClick={() => open(p.subject)} data-testid={`photo-${p.subject}`}>
            {p.subject.startsWith('scene:')
              ? <img src={img(SCENES[p.subject.slice(6) as SceneId].image(s).split('/').pop()!.replace('.webp', '') as any)} alt="" />
              : <div className="thumb-doc">{CLOSEUPS[p.subject]?.title}</div>}
            <span>{p.at} {p.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function MemoTab() {
  const memos = useGame((s) => s.memos);
  return (
    <>
      <h4>メモ（自動）</h4>
      <ul className="memo-list" data-testid="memo-list">
        {[...memos].reverse().map((m) => <li key={m}>{MEMOS[m]}</li>)}
      </ul>
    </>
  );
}

function HintsTab() {
  const s = useGame((x) => x);
  const [confirm, setConfirm] = useState<string | null>(null);
  const list = PUZZLES.map((p) => ({ p, st: puzzleStatus(s, p) })).filter((x) => x.st !== 'hidden');
  return (
    <>
      <h4>ヒント</h4>
      {list.length === 0 && <p style={{ fontSize: 13, color: '#8a939c' }}>気になる装置や仕掛けは、まだ見つけていない。まずは周りを見てまわろう。</p>}
      {list.map(({ p, st }) => {
        const used = s.hints[p.id] ?? 0;
        return (
          <div className="hint-card" key={p.id} data-testid={`hint-${p.id}`}>
            <div className="hd">
              <strong style={{ fontSize: 13.5 }}>{p.name}<span style={{ color: '#6d757d', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>{p.place}</span></strong>
              <span className={`st ${st}`}>{st === 'solved' ? '解決済み' : st === 'lacking' ? '情報が足りない？' : '解けそう'}</span>
            </div>
            {st === 'lacking' && <div className="lacking-note">いま持っている情報だけでは、まだ解けそうにない。先にほかの場所を調べてみよう。</div>}
            {p.hints.slice(0, used).map((h, i) => <p key={i}><span className="h-n">{i + 1}</span>{h}</p>)}
            {s.answers[p.id] && <p><span className="h-n">答</span>{p.answer}</p>}
            {st !== 'solved' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {used < 3 && <button className="btn" style={{ fontSize: 12, minHeight: 32, padding: '4px 12px' }} data-testid={`hint-next-${p.id}`} onClick={() => useHint(p.id)}>ヒント{used + 1}を見る</button>}
                {used >= 3 && !s.answers[p.id] && (confirm === p.id
                  ? <><button className="btn warn" style={{ fontSize: 12, minHeight: 32, padding: '4px 12px' }} onClick={() => { viewAnswer(p.id); setConfirm(null); }}>本当に答えを見る</button><button className="btn" style={{ fontSize: 12, minHeight: 32, padding: '4px 12px' }} onClick={() => setConfirm(null)}>やめる</button></>
                  : <button className="btn" style={{ fontSize: 12, minHeight: 32, padding: '4px 12px' }} onClick={() => setConfirm(p.id)}>答えを見る…</button>)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function SettingsTab() {
  const st = useSettings();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <h4>設定</h4>
      <div className="set-row">効果音・環境音<input type="range" min={0} max={1} step={0.05} value={st.volume} onChange={(e) => setSettings({ volume: Number(e.target.value) })} /></div>
      <div className="set-row">BGM（0で消音）<input type="range" min={0} max={1} step={0.05} value={st.musicVolume} onChange={(e) => setSettings({ musicVolume: Number(e.target.value) })} /></div>
      <div className="set-row">放送の字幕<input type="checkbox" checked={st.subtitles} onChange={(e) => setSettings({ subtitles: e.target.checked })} /></div>
      <div className="set-row">画面の揺らぎを減らす<input type="checkbox" checked={st.reduceMotion} onChange={(e) => setSettings({ reduceMotion: e.target.checked })} /></div>
      <div className="set-row">操作<span style={{ fontSize: 11.5, color: '#8a939c', textAlign: 'right' }}>クリック/タップで調べる・移動<br />右クリック/Escで戻る</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        <button className="btn" data-testid="to-title" onClick={() => { flushSave(); replaceState({ ...initialState() }); setUI({ phoneOpen: false }); }}>タイトルへ戻る（自動保存済み）</button>
        {!confirm
          ? <button className="btn warn" onClick={() => setConfirm(true)}>最初からやり直す…</button>
          : <button className="btn warn" onClick={() => { resetGame(); setUI({ phoneOpen: false }); }}>セーブを消して最初から</button>}
      </div>
    </>
  );
}
