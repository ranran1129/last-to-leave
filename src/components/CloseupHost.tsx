import { CLOSEUPS } from '../closeups/registry';
import { closeCloseup, takePhoto } from '../game/engine';
import { useUI, setUI } from '../game/ui';

export default function CloseupHost({ id }: { id: string }) {
  const def = CLOSEUPS[id];
  const fromPhoto = useUI((u) => u.closeupFromPhoto);
  if (!def) return null;
  const C = def.View;
  const back = () => {
    if (fromPhoto) { setUI({ closeup: null, closeupFromPhoto: false, phoneOpen: true, phoneTab: 'photos' }); return; }
    closeCloseup();
  };
  return (
    <div className="closeup" data-testid={`closeup-${id}`} onClick={back} onContextMenu={(e) => { e.preventDefault(); back(); }}>
      <div className={`closeup-body k-${def.kind}`} onClick={(e) => e.stopPropagation()}>
        <C photo={fromPhoto} />
      </div>
      <div className="closeup-bar" onClick={(e) => e.stopPropagation()}>
        <button className="btn" data-testid="closeup-back" onClick={back}>{fromPhoto ? '写真一覧へ' : '戻る'}</button>
        {def.photo && !fromPhoto && (
          <button className="btn" data-testid="take-photo" onClick={() => takePhoto(id, def.title)}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path d="M4 7h4l2-2h4l2 2h4v12H4z" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
            撮影
          </button>
        )}
      </div>
    </div>
  );
}
