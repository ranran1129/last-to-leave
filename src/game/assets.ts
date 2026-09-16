/**
 * Asset manifest. Every image the game references is listed here; the test
 * suite checks each file exists in public/img so a build can never ship a 404.
 */
export const IMAGES = [
  'arena', 'arenaback', 'arenadoor', 'stagefront', 'foh', 'sounddesk', 'lightdesk',
  'lobby', 'gate', 'merch', 'stock', 'stock_empty', 'flowers', 'corridor', 'stage', 'stagefloor',
  'backyard', 'distro', 'dock', 'outside', 'penlights', 'preshow',
  'stand_orange', 'stand_white', 'stand_sky', 'stand_yellow', 'stand_orange2',
] as const;

export type ImageName = (typeof IMAGES)[number];

export const img = (name: ImageName) => `${import.meta.env.BASE_URL}img/${name}.webp`;

let started = false;
export function preloadAll() {
  if (started) return;
  started = true;
  // first the opening area, then the rest in the background
  const order = [...IMAGES];
  let i = 0;
  const next = () => {
    if (i >= order.length) return;
    const im = new Image();
    im.onload = im.onerror = () => { i++; next(); };
    im.src = img(order[i]);
  };
  next();
}
