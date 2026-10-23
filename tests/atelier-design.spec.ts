import { test, expect } from '@playwright/test';

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`editorial spreads and all original portraits remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?guest=olena');
    await page.evaluate(() => document.fonts.ready);
    const open = page.getByRole('button', { name: 'Відкрити запрошення', exact: true });
    await expect(open).toBeInViewport();
    await expect(page.locator('.stationery-seal')).toBeInViewport();
    await page.screenshot({ path: `output/atelier/final-envelope-${width}.png` });
    await page.getByRole('button', { name: 'Пропустити анімацію' }).click();
    await page.locator('.invitation-overlay').waitFor({ state: 'detached' });
    await expect(page.locator('.hero h1')).toHaveAttribute('aria-label', 'Андрій & Марія');
    const cleanCapture = ".header,.skip-link,.dev-tools,[data-agentation]{visibility:hidden!important}";
    await page.locator('#home').screenshot({ path: `output/atelier/final-home-${width}.png`, style: cleanCapture });
    for (const selector of ['#letter', '#story', '#date', '#schedule', '#dresscode', '#venue', '#rsvp', '#wishes', '.footer']) {
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await expect(section.locator('h2').first()).toBeVisible();
      const headings = await section.locator('h2').evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, font: parseFloat(getComputedStyle(node).fontSize) };
      }));
      for (const heading of headings) {
        expect(heading.left).toBeGreaterThanOrEqual(-1);
        expect(heading.right).toBeLessThanOrEqual(width + 1);
        expect(heading.font).toBeGreaterThanOrEqual(34);
      }
      await section.screenshot({ path: `output/atelier/final-${selector.replace(/[#.]/g, '')}-${width}.png`, style: cleanCapture });
    }
    expect(await page.locator('img').evaluateAll(nodes => nodes.every(node => node.complete && node.naturalWidth > 0))).toBe(true);
    expect(await page.locator('img').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')).sort())).toEqual([
      '/images/guest-couple-detail.jpg', '/images/guest-couple-footer.jpg', '/images/guest-couple-hero.jpg', '/images/guest-couple-story.jpg', '/images/table.jpg',
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('the invitation remains reachable on a short landscape screen', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/?guest=olena');
  const button = page.getByRole('button', { name: 'Відкрити запрошення', exact: true });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
  await button.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('WebKit preserves the wax, paper layers and touch navigation', async ({ baseURL }) => {
  const { webkit } = await import('@playwright/test');
  const browser = await webkit.launch({ executablePath: webkit.executablePath(), timeout: 15000 });
  try {
    const page = await browser.newPage({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?guest=olena', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.wax-cast')).toBeVisible();
    await expect(page.locator('.stationery-flap')).toHaveCSS('filter', 'none');
    await page.screenshot({ path: 'output/atelier/webkit-envelope-390.png' });
    await page.getByRole('button', { name: 'Відкрити запрошення', exact: true }).tap();
    for (const stage of ['rising', 'clear', 'foreground'] as const) {
      await page.evaluate(stage => window.__invitationPreview?.seek(stage), stage);
      const layers = await page.evaluate(() => {
        const card = document.querySelector('.stationery-card-carrier')!;
        const pocket = document.querySelector('.stationery-pocket')!;
        return { bottom: card.getBoundingClientRect().bottom, hinge: pocket.getBoundingClientRect().top, z: Number(getComputedStyle(card).zIndex), front: Number(getComputedStyle(pocket).zIndex) };
      });
      if (stage === 'rising') expect(layers.bottom).toBeGreaterThan(layers.hinge);
      if (stage === 'clear') expect(layers.bottom).toBeLessThan(layers.hinge - 5);
      if (stage === 'foreground') expect(layers.z).toBeGreaterThan(layers.front);
      await page.screenshot({ path: `output/atelier/webkit-envelope-${stage}.png` });
    }
    await page.getByRole('button', { name: 'Пропустити анімацію' }).tap();
    await page.getByRole('button', { name: 'Відкрити меню' }).tap();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#date').scrollIntoViewIfNeeded();
    await expect(page.locator('.date-main')).toHaveCSS('opacity', '1');
    await expect(page.locator('.wedding-day')).toHaveAttribute('data-heart-state', 'complete');
    await page.locator('#date').screenshot({ path: 'output/atelier/webkit-date-390.png', style: '.header,.skip-link{visibility:hidden!important}' });
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
