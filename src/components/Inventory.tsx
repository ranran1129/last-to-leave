import { useGame } from '../game/store';
import { setUI, say } from '../game/ui';
import { holdItem } from '../game/engine';
import { ITEMS, ItemIcon } from '../game/items';
import type { ItemId } from '../game/types';
import { openCloseup } from '../game/engine';

/**
 * Tap an item once to hold it (then tap a place in the scene to use it).
 * Tap the held item again to look at it closely.
 */
export default function Inventory() {
  const items = useGame((s) => s.items);
  const held = useGame((s) => s.heldItem);
  const pen = useGame((s) => s.penColor);
  const click = (id: ItemId) => {
    if (held === id) { holdItem(null); openCloseup(`item:${id}`); return; }
    holdItem(id);
    say(`${ITEMS[id].name}を手に取った。使いたい場所をタップ。もう一度押すと、近くで見られる。`, 2600);
  };
  return (
    <div className="bar" data-testid="inventory">
      {items.map((id) => (
        <button key={id} className={`slot ${held === id ? 'held' : ''}`} onClick={() => click(id)} aria-label={ITEMS[id].name} data-testid={`item-${id}`}>
          <ItemIcon id={id} pen={pen} />
        </button>
      ))}
      <div className="bar-hint">{held ? `手に持っている：${ITEMS[held].name}` : ''}</div>
    </div>
  );
}
