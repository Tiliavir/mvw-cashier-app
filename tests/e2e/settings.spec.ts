import { expect, test } from '@playwright/test';
import { buildClosedEventSeed, buildSeedState, STORAGE_KEY } from './utils';

test('settings shows active and past events', async ({ page }) => {
  const activeSeed = buildSeedState();
  const closedSeed = buildClosedEventSeed();
  const merged = {
    events: [...activeSeed.state.events, ...closedSeed.state.events],
    activeEventId: activeSeed.state.activeEventId,
  };

  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(merged)],
  );

  await page.goto('/settings/');

  await expect(page.locator('#settings-event-name')).toContainText('Vereinsfest');
  await expect(page.locator('.all-event-row')).toHaveCount(2);
});
