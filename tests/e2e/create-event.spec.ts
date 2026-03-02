import { test, expect } from '@playwright/test';

test('create flow enables start and navigates to cashier', async ({ page }) => {
  await page.goto('/create/');

  await page.fill('#event-name', 'Vereinsfest');
  await page.fill('#item-name', 'Wasser');
  await page.fill('#item-price', '1.50');
  await page.click('#btn-add-item');

  await page.check('#accept-liability');

  const startButton = page.locator('#btn-start-event');
  await expect(startButton).toBeEnabled();

  await startButton.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#cashier-event-name')).toContainText('Vereinsfest');
});

