import { expect, test } from '@playwright/test';

import { STORAGE_STATE, TEST_BOARD_ID } from './sync.fixtures';

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

test('a shape drawn in one client appears with real geometry in the other', async ({ browser }) => {
  const url = `/board/${TEST_BOARD_ID}`;
  const ctxA = await browser.newContext({ storageState: STORAGE_STATE });
  const ctxB = await browser.newContext({ storageState: STORAGE_STATE });
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  try {
    await a.goto(url);
    await b.goto(url);
    await a.locator('.excalidraw').waitFor();
    await b.locator('.excalidraw').waitFor();

    const before = await b.evaluate(visibleElementCount);
    expect(before, 'E2E scene hook must be present').toBeGreaterThanOrEqual(0);

    // Draw a rectangle in client A. Excalidraw needs a real pointer sequence
    // with small gaps between moves, otherwise the drag is dropped.
    await a.locator('[title*="Rectangle"]').first().click();
    await a.waitForTimeout(150);
    await a.mouse.move(620, 320);
    await a.mouse.down();
    for (let i = 1; i <= 8; i += 1) {
      await a.mouse.move(620 + i * 24, 320 + i * 18);
      await a.waitForTimeout(20);
    }
    await a.mouse.up();

    // Confirm the draw registered locally before asserting it propagated.
    await expect.poll(() => a.evaluate(visibleElementCount), { timeout: 5_000 }).toBeGreaterThan(0);

    // Client B should receive it with non-zero geometry (the regression guard).
    await expect
      .poll(() => b.evaluate(visibleElementCount), { timeout: 15_000 })
      .toBeGreaterThan(before);
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
