import { expect, test } from '@playwright/test';

// Public, unauthenticated flows — OAuth-gated flows are out of scope here.

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CollabBoard/i);
});

test('login page shows OAuth providers', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Continue with GitHub/i })).toBeVisible();
});

test('logged-out dashboard redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});

test('logged-out board redirects to login', async ({ page }) => {
  await page.goto('/board/does-not-matter');
  await expect(page).toHaveURL(/\/login/);
});

test('boards API returns 401 when unauthenticated', async ({ request }) => {
  const res = await request.get('/api/boards');
  expect(res.status()).toBe(401);
});
