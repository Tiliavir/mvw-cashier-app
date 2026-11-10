import { expect, test } from '@playwright/test';
import { buildSeedState, STORAGE_KEY } from './utils';

test('cashier renders items and updates totals', async ({ page }) => {
  const { state } = buildSeedState();
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(state)],
  );

  await page.goto('/');

  const tiles = page.locator('.item-tile');
  await expect(tiles).toHaveCount(2);

  await tiles.first().click();
  await expect(page.locator('#tx-total')).toContainText('1,50');
});
