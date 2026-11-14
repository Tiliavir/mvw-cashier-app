import { expect, test } from '@playwright/test';
import { buildSeedState, STORAGE_KEY } from './utils';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

test('manifest makes the app installable as standalone app', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('manifest.webmanifest');

  const response = await request.get(`/${href}`);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();

  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  const icons = manifest.icons as ManifestIcon[];
  for (const purpose of ['any', 'maskable']) {
    for (const size of ['192x192', '512x512']) {
      const icon = icons.find((i) => i.purpose === purpose && i.sizes === size);
      expect(icon, `${purpose} ${size}`).toBeDefined();
      const iconResponse = await request.get(`/${icon?.src}`);
      expect(iconResponse.ok()).toBe(true);
      expect(iconResponse.headers()['content-type']).toBe('image/png');
    }
  }
});

test('app works offline once the service worker is installed', async ({ page, context }) => {
  const seed = buildSeedState();
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value);
    },
    [STORAGE_KEY, JSON.stringify(seed.state)],
  );

  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);

  await page.goto('/settings/');
  await expect(page.locator('#settings-event-name')).toContainText('Vereinsfest');

  await page.goto('/');
  await expect(page.locator('#cashier-event-name')).toContainText('Vereinsfest');
});
