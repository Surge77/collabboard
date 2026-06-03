import fs from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { BOARDS_FILE, type BoardKey, STORAGE_STATE } from './sync.fixtures';

// global-setup created a fresh empty board per key for this run.
const TEST_BOARDS = JSON.parse(fs.readFileSync(BOARDS_FILE, 'utf8')) as Record<BoardKey, string>;

// Reads the test-only handle exposed by ExcalidrawSurface under
// NEXT_PUBLIC_E2E_HOOKS. Counts rendered (non-zero-size) elements — the 0x0
// reconciliation bug kept this at zero in the receiving client even when the
// underlying Yjs doc had synced.
interface SceneWindow {
  __exApi?: { getSceneElements: () => ReadonlyArray<{ width: number; height: number }> };
}

function visibleElementCount(): number {
  const api = (window as unknown as SceneWindow).__exApi;
  if (!api) return -1; // hook missing — fail loudly rather than silently pass
  return api.getSceneElements().filter((e) => e.width > 0 && e.height > 0).length;
}

const count = (page: Page) => page.evaluate(visibleElementCount);

// Excalidraw needs a real pointer sequence with small gaps between moves,
// otherwise the drag is dropped and no element is created.
async function drawRect(page: Page, x: number, y: number): Promise<void> {
  await page.locator('[title*="Rectangle"]').first().click();
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) {
    await page.mouse.move(x + i * 18, y + i * 14);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
}

async function openBoard(page: Page, boardId: string): Promise<void> {
  await page.goto(`/board/${boardId}`);
  await page.locator('.excalidraw').waitFor();
  expect(await count(page), 'E2E scene hook must be present').toBeGreaterThanOrEqual(0);
  // Let the Liveblocks provider finish connecting before we draw, so an edit
  // can't race ahead of the room being joined on both sides.
  await page.waitForTimeout(2_500);
}

// Time allowed for a change to propagate through Liveblocks to the other client.
const PROPAGATE = 20_000;

// Each run uses fresh empty boards (global-setup), so absolute counts are safe.
test.describe('canvas realtime sync', () => {
  test.describe.configure({ mode: 'serial' });

  test('a shape drawn in one client appears with real geometry in the other', async ({
    browser,
  }) => {
    test.slow(); // live Liveblocks round-trips can be slow; triple the timeout
    const ctxA = await browser.newContext({ storageState: STORAGE_STATE });
    const ctxB = await browser.newContext({ storageState: STORAGE_STATE });
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    try {
      await openBoard(a, TEST_BOARDS.draw);
      await openBoard(b, TEST_BOARDS.draw);

      await drawRect(a, 620, 320);
      await expect.poll(() => count(a), { timeout: 5_000 }).toBe(1);
      await expect.poll(() => count(b), { timeout: PROPAGATE }).toBe(1);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('multiple shapes all sync to the other client', async ({ browser }) => {
    test.slow();
    const ctxA = await browser.newContext({ storageState: STORAGE_STATE });
    const ctxB = await browser.newContext({ storageState: STORAGE_STATE });
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    try {
      await openBoard(a, TEST_BOARDS.multi);
      await openBoard(b, TEST_BOARDS.multi);

      await drawRect(a, 280, 250);
      await drawRect(a, 560, 250);
      await drawRect(a, 840, 250);

      await expect.poll(() => count(a), { timeout: 5_000 }).toBe(3);
      await expect.poll(() => count(b), { timeout: PROPAGATE }).toBe(3);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });

  test('deleting a shape in one client removes it in the other', async ({ browser }) => {
    test.slow();
    const ctxA = await browser.newContext({ storageState: STORAGE_STATE });
    const ctxB = await browser.newContext({ storageState: STORAGE_STATE });
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    try {
      await openBoard(a, TEST_BOARDS.remove);
      await openBoard(b, TEST_BOARDS.remove);

      // Draw and confirm it reaches B.
      await drawRect(a, 620, 320);
      await expect.poll(() => count(b), { timeout: PROPAGATE }).toBe(1);

      // The freshly drawn shape stays selected; delete it.
      await a.keyboard.press('Delete');

      // The deletion must propagate (isDeleted), removing it from B's scene.
      await expect.poll(() => count(a), { timeout: 5_000 }).toBe(0);
      await expect.poll(() => count(b), { timeout: PROPAGATE }).toBe(0);
    } finally {
      await ctxA.close();
      await ctxB.close();
    }
  });
});
