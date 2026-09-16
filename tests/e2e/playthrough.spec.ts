import { test, expect, type Page } from '@playwright/test';

/** Full playthrough without hints: title → every puzzle → ending → results. */

const state = (p: Page) => p.evaluate(() => (window as any).__ltl.getState());
const tid = (p: Page, id: string) => p.locator(`[data-testid="${id}"]`);
const click = async (p: Page, id: string) => { await tid(p, id).first().click(); };

async function startNewGame(p: Page) {
  await p.goto('./');
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await click(p, 'new-game');
  await tid(p, 'intro').click();
  await tid(p, 'intro').click();
  await tid(p, 'intro').click();
  await tid(p, 'intro').click();
  await expect(tid(p, 'scene-arena')).toBeVisible();
}

async function back(p: Page) { await click(p, 'closeup-back'); }

async function solveP1(p: Page) {
  await click(p, 'hs-announce');
  await expect(tid(p, 'closeup-announce6')).toBeVisible();
  await click(p, 'take-photo');
  await back(p);
  await click(p, 'hs-to-stagefront');
  await click(p, 'hs-cases-l');
  await expect(tid(p, 'cases-svg')).toBeVisible();
  await back(p);
  await click(p, 'hs-back-arena');
  await click(p, 'hs-to-arenaback');
  await click(p, 'hs-to-door');
  await click(p, 'hs-panel');
  await click(p, 'blk-C3');
  await click(p, 'blk-D3');
  await click(p, 'p1-submit');
  await expect.poll(async () => (await state(p)).solved.p1).toBe(true);
  await back(p);
  await click(p, 'hs-door');
  await expect(tid(p, 'scene-lobby')).toBeVisible();
}

async function solveP2(p: Page) {
  await click(p, 'hs-to-merch');
  await click(p, 'hs-board'); await back(p);
  await click(p, 'hs-notes'); await back(p);
  await click(p, 'hs-note'); await back(p);
  await click(p, 'hs-lock');
  for (const d of ['U', 'R', 'U', 'R', 'U', 'L']) await click(p, `dir-${d}`);
  await click(p, 'lock-pull');
  await expect.poll(async () => (await state(p)).solved.p2).toBe(true);
  await back(p);
  await click(p, 'hs-stockdoor');
  await expect(tid(p, 'scene-stock')).toBeVisible();
  await click(p, 'hs-drum');
  await expect.poll(async () => (await state(p)).items).toContain('drum');
  await click(p, 'hs-back-merch');
  await click(p, 'hs-back-lobby');
}

async function solveP3(p: Page) {
  await click(p, 'hs-to-flowers');
  await click(p, 'hs-stands');
  await tid(p, 'stand-S1').click();
  await back(p);
  await click(p, 'hs-rack');
  for (const [card, slot] of [['S3', 0], ['S1', 1], ['S4', 2], ['S2', 3], ['S5', 4]] as const) {
    await tid(p, `card-${card}`).first().click();
    await click(p, `slot-${slot}`);
  }
  await expect.poll(async () => (await state(p)).solved.p3).toBe(true);
  await back(p);
  await click(p, 'hs-door');
  await expect(tid(p, 'scene-corridor')).toBeVisible();
}

async function readBackstageDocs(p: Page) {
  await click(p, 'hs-whiteboard'); await back(p);
  await click(p, 'hs-clip'); await back(p);
}

async function solveP8(p: Page) {
  await click(p, 'hs-to-stage');
  await click(p, 'hs-wingcase'); await back(p);
  // orange light does nothing
  await click(p, 'item-penlight');
  await click(p, 'hs-floor');
  expect((await state(p)).solved.p8).toBeFalsy();
  // switch the penlight to white and try again
  await click(p, 'item-penlight');
  await click(p, 'pen-white');
  await back(p);
  await click(p, 'item-penlight');
  await click(p, 'hs-floor');
  await expect.poll(async () => (await state(p)).solved.p8).toBe(true);
  await back(p);
  await click(p, 'hs-back-corridor');
}

async function solveP6(p: Page) {
  await click(p, 'hs-to-backyard');
  await expect(tid(p, 'scene-backyard')).toBeVisible();
  await click(p, 'hs-trucklist'); await back(p);
  await click(p, 'item-drum');
  await click(p, 'hs-cable');
  await expect.poll(async () => (await state(p)).flags.drumConnected).toBe(true);
  await click(p, 'hs-distro');
  // a wrong combination trips the generator and clears the board
  await click(p, 'brk-LX-SR');
  await click(p, 'brk-LX-CTR');
  await click(p, 'brk-CATER');
  await expect.poll(async () => (await state(p)).scratch.p6, { timeout: 8000 }).toEqual([]);
  await p.waitForTimeout(2500); // the generator needs a moment before it accepts breakers again
  await click(p, 'brk-LX-SL');
  await click(p, 'brk-FOH');
  await click(p, 'brk-DOCK SHT');
  await expect.poll(async () => (await state(p)).solved.p6, { timeout: 8000 }).toBe(true);
  await back(p);
}

async function goToFoh(p: Page) {
  await click(p, 'hs-to-corridor');
  await click(p, 'hs-to-lobby');
  await click(p, 'hs-back-lobby');
  await click(p, 'hs-to-arena');
  await click(p, 'hs-back-arenaback');
  await click(p, 'hs-to-foh');
  await expect(tid(p, 'scene-foh')).toBeVisible();
}

async function solveP4P5(p: Page) {
  await click(p, 'hs-sound');
  await click(p, 'src-CH6');
  await click(p, 'out-HOUSE');
  await click(p, 'out-LOBBY');
  await click(p, 'out-BS-SL-2');
  await click(p, 'sound-apply');
  await expect.poll(async () => (await state(p)).solved.p4).toBe(true);
  await back(p);
  await click(p, 'hs-light');
  for (const c of ['cell-3-2', 'cell-1-1', 'cell-0-3', 'cell--2-1', 'cell--4-2']) await click(p, c);
  await click(p, 'light-go');
  await expect.poll(async () => (await state(p)).solved.p5).toBe(true);
  await back(p);
}

async function solveMeta(p: Page) {
  await click(p, 'hs-back-arenaback');
  await click(p, 'hs-to-door');
  await click(p, 'hs-door');
  await click(p, 'hs-to-flowers');
  await click(p, 'hs-door');
  await click(p, 'hs-to-backyard');
  await click(p, 'hs-shutter');
  await expect(tid(p, 'scene-dock')).toBeVisible();
  await click(p, 'hs-panel');
  await click(p, 'mblk-C3');
  await click(p, 'door-TL');
  await click(p, 'gate-6');
  await click(p, 'meta-run');
  await expect.poll(async () => (await state(p)).solved.meta).toBe(true);
  await back(p);
}

async function walkOut(p: Page) {
  await click(p, 'hs-back-backyard');
  await click(p, 'hs-to-corridor');
  await click(p, 'hs-to-lobby');
  await click(p, 'hs-back-lobby');
  await click(p, 'hs-to-gate');
  await click(p, 'hs-push');
  await expect(tid(p, 'ending-0')).toBeVisible();
  await tid(p, 'ending-0').click();
  await tid(p, 'ending-1').click();
  await tid(p, 'ending-2').click();
  await tid(p, 'ending-3').click();
  await expect(tid(p, 'results')).toBeVisible();
  await expect(tid(p, 'clear-time')).toBeVisible();
}

test('full playthrough without hints', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const missing: string[] = [];
  page.on('response', (r) => { if (r.status() === 404) missing.push(r.url()); });

  await startNewGame(page);
  await solveP1(page);
  await solveP2(page);
  await solveP3(page);
  await readBackstageDocs(page);
  await solveP8(page);
  await solveP6(page);
  await goToFoh(page);
  await solveP4P5(page);
  await solveMeta(page);
  await walkOut(page);
  await click(page, 'back-title');
  await expect(tid(page, 'new-game')).toBeVisible();

  expect(missing, `404 assets: ${missing.join(', ')}`).toEqual([]);
  expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
});

test('save, reload and continue keeps progress', async ({ page }) => {
  await startNewGame(page);
  await solveP1(page);
  await page.reload();
  await click(page, 'continue');
  await expect.poll(async () => (await state(page)).solved.p1).toBe(true);
  await expect(tid(page, 'scene-lobby')).toBeVisible();
});

test('reset clears the save', async ({ page }) => {
  await startNewGame(page);
  await solveP1(page);
  await click(page, 'phone-btn');
  await click(page, 'tab-settings');
  await click(page, 'to-title');
  await click(page, 'reset');
  await click(page, 'reset-confirm');
  await click(page, 'new-game');
  await tid(page, 'intro').click();
  await expect.poll(async () => (await state(page)).solved.p1).toBeFalsy();
});

test('hints stay gated until the information exists', async ({ page }) => {
  await startNewGame(page);
  await click(page, 'hs-to-arenaback');
  await click(page, 'hs-to-door');
  await click(page, 'hs-panel');
  await back(page);
  await click(page, 'phone-btn');
  await click(page, 'tab-hints');
  await expect(tid(page, 'hint-p1')).toContainText('情報不足');
});
