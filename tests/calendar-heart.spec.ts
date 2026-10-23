import { test, expect, webkit } from '@playwright/test';

for (const engine of ['Chrome', 'WebKit'] as const) {
  test(`wedding heart is complete before scrolling and stays centered in ${engine}`, async ({ browser, baseURL }) => {
    test.setTimeout(90000);
    const target = engine === 'WebKit' ? await webkit.launch({ executablePath: webkit.executablePath(), timeout: 15000 }) : browser;
    try {
      for (const width of [320, 390, 768, 1024, 1440]) {
        for (const reducedMotion of ['no-preference', 'reduce'] as const) {
          const context = await target.newContext({ baseURL, viewport: { width, height: 900 }, isMobile: width < 600, hasTouch: width < 600, reducedMotion });
          const page = await context.newPage();
          page.setDefaultNavigationTimeout(15000);
          const errors: string[] = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.goto('/?guest=olena', { waitUntil: 'domcontentloaded' });
          await page.getByRole('button', { name: 'Пропустити анімацію', exact: true }).click();
          const date = page.locator('.wedding-day');
          const heart = date.locator('.calendar-heart');
          const path = heart.locator('path');
          // The date marker must be complete even while the calendar is offscreen.
          await expect(date).toHaveText('30');
          await expect(path).toHaveCSS('stroke-dasharray', 'none');
          await expect(path).not.toHaveAttribute('pathLength');
          await page.locator('.calendar').scrollIntoViewIfNeeded();
          await expect(heart).toBeVisible();
          const cell = (await date.boundingBox())!;
          const outline = (await heart.boundingBox())!;
          expect(Math.abs(cell.x + cell.width / 2 - outline.x - outline.width / 2)).toBeLessThan(1);
          expect(Math.abs(cell.y + cell.height / 2 - outline.y - outline.height / 2)).toBeLessThan(1);
          expect(await path.evaluate(node => (node as SVGPathElement).getTotalLength())).toBeGreaterThan(100);
          expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
          await page.locator('.calendar').screenshot({ path: `output/calendar-heart/${engine}-${width}-${reducedMotion}.png`, style: '.header,.skip-link{visibility:hidden!important}' });
          expect(errors).toEqual([]);
          await context.close();
        }
      }
    } finally {
      if (engine === 'WebKit') await target.close();
    }
  });
}
