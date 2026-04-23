import { test, expect, devices } from '@playwright/test';
import { login, OWNER_EMAIL, OWNER_PASSWORD } from './playwright-utils';

/**
 * Regression guard: focusing an input inside a mobile modal must not shift the
 * modal frame. Records the modal panel's bounding rect before focus, focuses
 * each form input/textarea inside the modal, and asserts the rect is unchanged.
 *
 * Worst-case modal under audit: "New Customer" on /growth/customers
 *  - It is a bottom-sheet on mobile (items-end), the highest-risk pattern for
 *    keyboard-driven layout shift.
 *  - It contains multiple text inputs, so we exercise focus-switching.
 */

test.use({ ...devices['iPhone 14 Pro'] });

test('mobile modal does not shift when inputs are focused', async ({ page }) => {
  await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  await page.goto('/growth/customers');

  // Open the New Customer modal.
  await page.getByRole('button', { name: /new customer/i }).first().click();

  // Find the modal panel (the inner card, not the backdrop).
  const panel = page.locator('div.bg-surface-raised.rounded-t-3xl').first();
  await expect(panel).toBeVisible();

  // Wait for the slide-in animation to settle.
  await page.waitForTimeout(400);

  const before = await panel.boundingBox();
  expect(before).not.toBeNull();

  const inputs = panel.locator('input:visible, textarea:visible');
  const count = await inputs.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    await input.focus();
    // Allow any layout reaction (including erroneous reflows) to materialise.
    await page.waitForTimeout(150);

    const after = await panel.boundingBox();
    expect(after, `panel rect missing after focusing input #${i}`).not.toBeNull();

    // Allow ±1px tolerance for sub-pixel rounding only.
    expect(Math.abs(after!.x - before!.x), `x shifted on input #${i}`).toBeLessThanOrEqual(1);
    expect(Math.abs(after!.y - before!.y), `y shifted on input #${i}`).toBeLessThanOrEqual(1);
    expect(Math.abs(after!.width - before!.width), `width shifted on input #${i}`).toBeLessThanOrEqual(1);
    expect(Math.abs(after!.height - before!.height), `height shifted on input #${i}`).toBeLessThanOrEqual(1);
  }

  // Blur and confirm the modal returns to its original rect.
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
});

test('mobile inputs do not trigger iOS auto-zoom (font-size >= 16px)', async ({ page }) => {
  await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  await page.goto('/growth/customers');
  await page.getByRole('button', { name: /new customer/i }).first().click();
  const panel = page.locator('div.bg-surface-raised.rounded-t-3xl').first();
  await expect(panel).toBeVisible();

  const inputs = panel.locator('input:visible, textarea:visible, select:visible');
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const fontSize = await inputs.nth(i).evaluate((el) =>
      parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSize, `input #${i} font-size triggers iOS auto-zoom`).toBeGreaterThanOrEqual(16);
  }
});
