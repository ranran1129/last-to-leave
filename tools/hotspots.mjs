// ホットスポットの当たり判定を写真に重ねて書き出す（位置合わせ用）
// usage: node tools/hotspots.mjs [outDir]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'tools/shots/hs';
mkdirSync(out, { recursive: true });
const SCENES = ['arena', 'arenaback', 'arenadoor', 'stagefront', 'foh', 'lobby', 'gate', 'merch', 'stock', 'flowers', 'corridor', 'stage', 'backyard', 'dock'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5178');
await page.evaluate(() => localStorage.clear());
await page.click('[data-testid="new-game"]');
for (let i = 0; i < 4; i++) { await page.click('[data-testid="intro"]'); await page.waitForTimeout(120); }
await page.evaluate(() => {
  window.__ltl.hotspots(true);
  window.__ltl.patch({
    items: ['ticket', 'penlight', 'drum', 'silvertape'],
    solved: { p1: true, p2: true, p3: true, p6: true, p8: true },
    flags: { drumConnected: false },
  });
});
for (const s of SCENES) {
  await page.evaluate((id) => window.__ltl.patch({ scene: id }), s);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${s}.png` });
}
await browser.close();
console.log('hotspot maps written to', out);
