import { expect, test } from '@playwright/test';
import { buildSeedState, STORAGE_KEY } from './utils';

test('edit reorders items by drag and drop and persists the order', async ({ page }) => {
  const seed = buildSeedState();
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(seed.state)],
  );

  await page.goto(`/edit/?id=${seed.eventId}`);

  const rows = page.locator('#setup-items-list .setup-item-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toHaveAttribute('data-id', 'item-1');

  await rows.nth(1).dragTo(rows.nth(0));

  await expect(rows.first()).toHaveAttribute('data-id', 'item-2');
  const order = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? '{}');
    return state.events[0].items.map((item: { id: string }) => item.id);
  }, STORAGE_KEY);
  expect(order).toEqual(['item-2', 'item-1']);
});
