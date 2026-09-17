// Visual QA helper: capture key scenes and close-ups at desktop size.
// usage: node tools/shots.mjs [outDir] [baseURL]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] ?? 'tools/shots';
const base = process.argv[3] ?? 'http://localhost:5178';
mkdirSync(out, { recursive: true });

const SCENES = ['arena', 'arenaback', 'arenadoor', 'stagefront', 'foh', 'lobby', 'gate', 'merch', 'stock', 'flowers', 'corridor', 'stage', 'backyard', 'dock'];
const CLOSEUPS = ['item:ticket', 'item:penlight', 'item:drum', 'item:silvertape', 'announce6', 'cases', 'fohsheet', 'p1panel', 'merchBoard', 'merchNotes', 'doorNote', 'dirLock', 'stands', 'rack', 'whiteboard', 'stageSheet', 'truckList', 'distro', 'soundDesk', 'lightDesk', 'stageFloor', 'dockPanel', 'preshow', 'gateDisplay'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.click('[data-testid="new-game"]');
for (let i = 0; i < 4; i++) { await page.click('[data-testid="intro"]'); await page.waitForTimeout(120); }
// unlock everything so every state can be photographed
await page.evaluate(() => window.__ltl.patch({
  items: ['ticket', 'penlight', 'drum', 'silvertape'],
  solved: { p1: true, p2: true, p3: true, p4: true, p5: true, p6: true, p8: true },
  flags: { drumConnected: true },
  photos: [{ id: 'a', subject: 'fohsheet', label: '退場確認（客席側）', at: '23:50' }, { id: 'b', subject: 'stageSheet', label: '退場確認（舞台側）', at: '23:52' }],
}));

for (const s of SCENES) {
  await page.evaluate((id) => window.__ltl.patch({ scene: id }), s);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/scene-${s}.png` });
}
for (const c of CLOSEUPS) {
  await page.evaluate((id) => { window.__ltl.patch({ scene: 'arena' }); window.__ltl.open(id); }, c);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/closeup-${c.replace(':', '-')}.png` });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}
await browser.close();
console.log('shots written to', out);
