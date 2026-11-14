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

test('edit saves and removes items and persists the change', async ({ page }) => {
  const seed = buildSeedState();
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(seed.state)],
  );
  await page.goto(`/edit/?id=${seed.eventId}`);

  const rows = page.locator('#setup-items-list .setup-item-row');
  await rows.first().locator('.setup-item-name').click();
  const editRow = page.locator('#setup-items-list .setup-item-edit');
  await editRow.locator('.edit-name').fill('Limo');
  await editRow.locator('.edit-price').fill('2.5');
  await editRow.locator('.btn-save-item').click();
  await expect(rows.first().locator('.setup-item-name')).toHaveText('Limo');

  await rows.nth(1).locator('.btn-remove-item').click();
  await expect(rows).toHaveCount(1);

  const items = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key) ?? '{}');
    return state.events[0].items.map((item: { name: string; price: number }) => [item.name, item.price]);
  }, STORAGE_KEY);
  expect(items).toEqual([['Limo', 2.5]]);
});
