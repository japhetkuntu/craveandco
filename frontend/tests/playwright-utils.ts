import { expect, Page } from '@playwright/test';

export const OWNER_EMAIL = 'ceo@craveandco.com';
export const OWNER_PASSWORD = 'Japhet1998@';
export const TEST_PASSWORD = 'Test1234!';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForSelector('input[placeholder="you@craveandco.com"]', { timeout: 15000 });
  await page.fill('input[placeholder="you@craveandco.com"]', email);
  await page.fill('input[placeholder="••••••••"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL(/\/(owner|ops|kitchen|growth)/, { timeout: 15000 });
}

export async function logout(page: Page) {
  const signOutButton = page.getByRole('button', { name: /sign out/i });
  await expect(signOutButton).toBeVisible({ timeout: 10000 });
  await signOutButton.click();
  await expect(page).toHaveURL(/\/login/);
}

export async function createStaffMember(page: Page, { name, email, password, role }: { name: string; email: string; password: string; role: string }) {
  await page.goto('/owner/staff');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('combobox', { name: /role/i }).selectOption(role);
  await page.getByRole('button', { name: /add staff member/i }).click();
  await expect(page.locator('text=' + email)).toBeVisible({ timeout: 15000 });
}

export async function openNavLink(page: Page, label: string) {
  const link = page.getByRole('link', { name: label });
  await expect(link).toBeVisible({ timeout: 10000 });
  await link.click();
}
