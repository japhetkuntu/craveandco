import { test, expect, BrowserContext, Page } from '@playwright/test';
import { login, OWNER_EMAIL, OWNER_PASSWORD } from './playwright-utils';

let page: Page;
let context: BrowserContext;

test.describe('Crave & Co Auth', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should load login page and sign in successfully', async () => {
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });
});
