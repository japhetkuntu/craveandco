import { test, expect } from '@playwright/test';
import { login, logout, createStaffMember, OWNER_EMAIL, OWNER_PASSWORD, TEST_PASSWORD } from './playwright-utils';

const timestamp = Date.now();
const kitchenEmail = `kitchen.${timestamp}@craveandco.com`;
const opsEmail = `ops.${timestamp}@craveandco.com`;
const growthEmail = `growth.${timestamp}@craveandco.com`;

const portalRoutes = {
  kitchen: [
    { path: '/kitchen', heading: /kitchen/i },
    { path: '/kitchen/prep', heading: /prep list/i },
    { path: '/kitchen/stock', heading: /stock/i },
    { path: '/kitchen/waste', heading: /waste/i },
    { path: '/kitchen/handover', heading: /handover/i },
  ],
  ops: [
    { path: '/ops', heading: /command center/i },
    { path: '/ops/orders', heading: /orders/i },
    { path: '/ops/inventory', heading: /inventory/i },
    { path: '/ops/purchasing', heading: /purchasing/i },
    { path: '/ops/staff', heading: /staff/i },
    { path: '/ops/checklists', heading: /checklists/i },
    { path: '/ops/day-close', heading: /day close/i },
  ],
  growth: [
    { path: '/growth', heading: /growth/i },
    { path: '/growth/pos', heading: /pos/i },
    { path: '/growth/customers', heading: /customers/i },
    { path: '/growth/campaigns', heading: /campaigns/i },
    { path: '/growth/loyalty', heading: /loyalty/i },
    { path: '/growth/feedback', heading: /feedback/i },
    { path: '/growth/churn', heading: /churn/i },
  ],
};

async function assertPageHeading(page: any, heading: RegExp) {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15000 });
}

test.describe.serial('Comprehensive actor portal coverage', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);

    await createStaffMember(page, {
      name: 'Kitchen Staff Tester',
      email: kitchenEmail,
      password: TEST_PASSWORD,
      role: 'KITCHEN_STAFF',
    });

    await createStaffMember(page, {
      name: 'Operations Manager Tester',
      email: opsEmail,
      password: TEST_PASSWORD,
      role: 'OPERATIONS_MANAGER',
    });

    await createStaffMember(page, {
      name: 'Growth Lead Tester',
      email: growthEmail,
      password: TEST_PASSWORD,
      role: 'GROWTH_LEAD',
    });

    await logout(page);
    await page.close();
  });

  test('kitchen staff can access all kitchen pages', async ({ page }) => {
    await login(page, kitchenEmail, TEST_PASSWORD);
    for (const route of portalRoutes.kitchen) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(`${route.path}`));
      await assertPageHeading(page, route.heading);
    }
    await logout(page);
  });

  test('operations manager can access all ops pages', async ({ page }) => {
    await login(page, opsEmail, TEST_PASSWORD);
    for (const route of portalRoutes.ops) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(`${route.path}`));
      await assertPageHeading(page, route.heading);
    }
    await logout(page);
  });

  test('growth lead can access all growth pages', async ({ page }) => {
    await login(page, growthEmail, TEST_PASSWORD);
    for (const route of portalRoutes.growth) {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(`${route.path}`));
      await assertPageHeading(page, route.heading);
    }
    await logout(page);
  });
});
