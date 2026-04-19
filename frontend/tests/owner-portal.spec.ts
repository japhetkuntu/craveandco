import { test, expect, BrowserContext, Page } from '@playwright/test';
import { login, OWNER_EMAIL, OWNER_PASSWORD } from './playwright-utils';

let page: Page;
let context: BrowserContext;

test.describe.serial('Owner portal flows', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should display owner dashboard cards', async () => {
    await page.goto('/owner');
    await expect(page.getByRole('heading', { name: /owner dashboard/i })).toBeVisible();
    await expect(page.locator('main').getByText('Sales Today')).toBeVisible();
    await expect(page.locator('main').locator('text=Orders').first()).toBeVisible();
    await expect(page.locator('main').getByText('Avg Ticket')).toBeVisible();
    await expect(page.locator('main').getByText('Gross Estimate')).toBeVisible();
  });

  test('should navigate to inventory and validate stock table', async () => {
    await page.goto('/owner/inventory');
    await expect(page).toHaveURL(/\/owner\/inventory/);
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText(/^Ingredient$/)).toBeVisible();
    await expect(page.getByText(/^Quantity$/)).toBeVisible();
    await expect(page.getByText(/^Unit$/)).toBeVisible();
    await expect(page.getByText(/^Status$/)).toBeVisible();

    const row = page.locator('tbody tr').first();
    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(0)).not.toBeEmpty();
    await expect(row.locator('td').nth(1)).not.toBeEmpty();
  });
});
