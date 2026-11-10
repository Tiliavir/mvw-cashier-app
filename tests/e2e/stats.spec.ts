import { expect, test } from '@playwright/test';
import { buildSeedState, STORAGE_KEY } from './utils';

test('stats renders cards and tables', async ({ page }) => {
  const { state, eventId } = buildSeedState();

  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(state)],
  );

  await page.goto(`/stats/?id=${eventId}`);

  await expect(page.locator('#stats-event-name')).toContainText('Vereinsfest');
  await expect(page.locator('.stat-card')).toHaveCount(2);
  await expect(page.locator('#items-table-body tr')).toHaveCount(1);
});
