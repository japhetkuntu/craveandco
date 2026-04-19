import { test, expect, BrowserContext, Page } from '@playwright/test';
import { login, OWNER_EMAIL, OWNER_PASSWORD } from './playwright-utils';

let page: Page;
let context: BrowserContext;

test.describe.serial('Ops portal flows', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should open ops inventory and render stock table', async () => {
    await page.goto('/ops/inventory');
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add movement/i })).toBeVisible();
    await expect(page.locator('th', { hasText: /Ingredient/i })).toBeVisible();
    await expect(page.locator('th', { hasText: /Qty/i })).toBeVisible();
    await expect(page.locator('th', { hasText: /Unit/i })).toBeVisible();
  });

  test('should open add movement form and validate inputs', async () => {
    await page.goto('/ops/inventory');
    await page.getByRole('button', { name: /add movement/i }).click();

    const ingredientSelect = page.locator('select').first();
    await expect(ingredientSelect).toBeVisible();
    await ingredientSelect.selectOption({ index: 1 });
    await page.getByPlaceholder('Quantity').fill('1.5');
    await page.getByPlaceholder('Reason (optional)').fill('Playwright test movement');
    await page.getByRole('button', { name: /record movement/i }).click();

    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});
