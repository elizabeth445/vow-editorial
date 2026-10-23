import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const context = await browser.newContext({ offline: true, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [], external = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if (/^https?:/.test(r.url())) external.push(r.url()); });
const url = pathToFileURL(path.resolve('html-export/wedding-invitation.html')).href;
try {
  await page.goto(url);
  await page.getByRole('button', { name: 'Відкрити запрошення', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.hero h1')).toContainText('Андрій');
  for (const image of await page.locator('img').all()) await image.scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0))).toBeTruthy();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Додати в календар' }).click();
  assert.equal((await download).suggestedFilename(), 'andrii-mariia.ics');
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await page.getByLabel('Із радістю буду!').check();
  await page.getByRole('button', { name: 'Продовжити' }).click();
  await page.getByLabel('Ваше ім’я та прізвище').fill('Олена HTML');
  await page.getByRole('button', { name: 'Продовжити' }).click();
  await page.getByRole('button', { name: 'Підтвердити відповідь' }).click();
  await expect(page.getByText('До зустрічі в наш день!')).toBeVisible();
  await page.reload();
  await expect(page.getByText('До зустрічі в наш день!')).toBeAttached();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if ([390, 1440].includes(width)) await page.screenshot({ path: `output/html-export/hero-${width}.png` });
  }
  await page.goto(url + '?guest=olena');
  await expect(page.locator('#letter h2')).toHaveText('Дорога Олено!');
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log('Standalone HTML passed offline: opening animation, all images, calendar click, RSVP save/reload, personalization, five widths, no external requests or JS errors.');
} finally { await browser.close(); }
