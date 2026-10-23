import { test, expect, webkit } from '@playwright/test';

for (const engine of ['Chrome', 'WebKit'] as const) {
  test(`calendar heart draws, replays and stays centered in ${engine}`, async ({ browser, baseURL }) => {
    test.setTimeout(120000);
    const target = engine === 'WebKit' ? await webkit.launch({ executablePath: webkit.executablePath(), timeout: 15000 }) : browser;
    try {
      for (const width of [320, 390, 768, 1024, 1440]) {
        for (const reducedMotion of ['no-preference', 'reduce'] as const) {
          const context = await target.newContext({ baseURL, viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600, reducedMotion });
          try {
            const page = await context.newPage();
            page.setDefaultNavigationTimeout(15000);
            const errors: string[] = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto('/?guest=olena', { waitUntil: 'domcontentloaded' });
            await page.getByRole('button', { name: 'Пропустити анімацію', exact: true }).click();
            const date = page.locator('.wedding-day');
            const button = date.getByRole('button', { name: 'Дата весілля 30 — обвести сердечком' });
            const heart = date.locator('.calendar-heart');
            const path = heart.locator('.calendar-heart-trace');
            const guide = heart.locator('.calendar-heart-guide');
            await expect(date).toHaveText('30');
            // A complete guide remains visible throughout drawing, including on Safari.
            await expect(guide).toHaveCSS('stroke-dasharray', 'none');
            await expect(guide).toHaveCSS('opacity', '0.24');
            await page.locator('.calendar').scrollIntoViewIfNeeded();
            await expect(heart).toBeVisible();
            if (reducedMotion === 'no-preference') {
              await expect(date).toHaveAttribute('data-heart-state', 'drawing');
              expect(await path.evaluate(node => parseFloat(getComputedStyle(node).strokeDashoffset))).toBeGreaterThan(0);
              if (width === 390) {
                await page.locator('.calendar').screenshot({ path: `output/calendar-heart/${engine}-drawing.png`, style: '.header,.skip-link{visibility:hidden!important}', animations: 'allow' });
              }
            }
            await expect(date).toHaveAttribute('data-heart-state', 'complete');
            await expect(path).toHaveCSS('stroke-dasharray', 'none');
            const cell = (await date.boundingBox())!;
            const outline = (await heart.boundingBox())!;
            const touch = (await button.boundingBox())!;
            expect(touch.width).toBeGreaterThanOrEqual(44);
            expect(touch.height).toBeGreaterThanOrEqual(44);
            expect(Math.abs(cell.x + cell.width / 2 - outline.x - outline.width / 2)).toBeLessThan(1);
            expect(Math.abs(cell.y + cell.height / 2 - outline.y - outline.height / 2)).toBeLessThan(1);
            expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
            await page.locator('.calendar').screenshot({ path: `output/calendar-heart/${engine}-${width}-${reducedMotion}.png`, style: '.header,.skip-link{visibility:hidden!important}' });
            if (width < 600) {
              await button.tap();
              if (reducedMotion === 'no-preference') {
                await expect(date).toHaveAttribute('data-heart-state', 'drawing');
                await button.tap();
                await button.tap();
                await expect(date).toHaveAttribute('data-heart-state', 'complete');
                await expect(path).toHaveCSS('stroke-dasharray', 'none');
                await button.focus();
                await page.keyboard.press('Enter');
                await expect(date).toHaveAttribute('data-heart-state', 'drawing');
                await page.emulateMedia({ reducedMotion: 'reduce' });
              }
              await expect(date).toHaveAttribute('data-heart-state', 'complete');
              await expect(path).toHaveCSS('stroke-dasharray', 'none');
              await expect(path).toHaveCSS('stroke-dashoffset', '0px');
            }
            expect(errors).toEqual([]);
          } finally {
            await context.close();
          }
        }
      }
    } finally {
      if (engine === 'WebKit') await target.close();
    }
  });
}
