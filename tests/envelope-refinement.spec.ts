import { test, expect, type Page } from "@playwright/test";

test("every reload and new visit starts with a closed envelope, including returning guests", async ({ page }) => {
  test.setTimeout(90000);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    for (const reducedMotion of ["no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion });
      await page.goto("/?guest=olena#rsvp");
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Пропустити анімацію" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      // A legacy flag from an earlier visit must no longer bypass the invitation.
      await page.evaluate(() => localStorage.setItem("ma-opened", "true"));
      await page.reload();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.locator(".invitation-overlay")).not.toHaveClass(/opening/);
      await expect(page.locator(".site-shell")).toHaveAttribute("inert", "");
      await expect(page.getByRole("button", { name: "Відкрити запрошення", exact: true })).toBeFocused();
      if (reducedMotion === "no-preference") {
        await page.screenshot({ path: `output/reopen/envelope-${width}.png` });
      }
      await page.getByRole("button", { name: "Пропустити анімацію" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.goto("/?guest=couple");
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.locator(".stationery-address")).toContainText("Максима");
    }
  }
});

type Stage = "seal" | "flap" | "rising" | "clear" | "foreground";
async function seek(page: Page, stage: Stage) {
  await page.evaluate(
    (stage) => window.__invitationPreview?.seek(stage),
    stage,
  );
}
async function layers(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector<HTMLElement>(
      ".stationery-card-carrier",
    )!;
    const back = document.querySelector<HTMLElement>(".stationery-back")!;
    const pocket = document.querySelector<HTMLElement>(".stationery-pocket")!;
    const c = card.getBoundingClientRect(),
      b = back.getBoundingClientRect();
    return {
      cardTop: c.top,
      cardBottom: c.bottom,
      bodyTop: b.top,
      bodyLeft: b.left,
      bodyWidth: b.width,
      bodyHeight: b.height,
      cardZ: Number(getComputedStyle(card).zIndex),
      pocketZ: Number(getComputedStyle(pocket).zIndex),
    };
  });
}
test("envelope physically clears the pocket before changing layers at every breakpoint", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await page.goto("/?guest=olena");
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("button", { name: "Відкрити запрошення", exact: true }),
    ).toBeFocused();
    await page.screenshot({
      path: `output/refinement/envelope-${width}-closed.png`,
    });
    await page
      .getByRole("button", { name: "Відкрити запрошення", exact: true })
      .click();
    for (const stage of [
      "seal",
      "flap",
      "rising",
      "clear",
      "foreground",
    ] as Stage[]) {
      await seek(page, stage);
      const state = await layers(page);
      if (stage === "rising") {
        expect(state.cardZ).toBeLessThan(state.pocketZ);
        expect(state.cardTop).toBeLessThan(state.bodyTop);
        expect(state.cardBottom).toBeGreaterThan(state.bodyTop);
        const front = await page.evaluate(
          ({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return !!el?.closest(
              ".stationery-fold,.stationery-pocket,.stationery-address",
            );
          },
          {
            x: state.bodyLeft + state.bodyWidth * 0.12,
            y: state.bodyTop + state.bodyHeight * 0.2,
          },
        );
        expect(front).toBe(true);
      }
      if (stage === "clear") {
        expect(state.cardBottom).toBeLessThan(state.bodyTop - 5);
        expect(state.cardZ).toBeLessThan(state.pocketZ);
      }
      if (stage === "foreground")
        expect(state.cardZ).toBeGreaterThan(state.pocketZ);
      await page.screenshot({
        path: `output/refinement/envelope-${width}-${stage}.png`,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByRole("button", { name: "Пропустити анімацію" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});
test("double input, skip during opening, replay, resize and live reduced motion", async ({
  page,
}) => {
  await page.goto("/?guest=olena");
  await page
    .getByRole("button", { name: "Відкрити запрошення", exact: true })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.locator(".invitation-overlay")).toHaveClass(/opening/);
  await seek(page, "clear");
  await page.setViewportSize({ width: 320, height: 844 });
  expect((await layers(page)).cardBottom).toBeLessThan(
    (await layers(page)).bodyTop,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".footer").getByRole("button").click();
  await page
    .getByRole("button", { name: "Відкрити запрошення", exact: true })
    .click();
  await seek(page, "rising");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.dataset.smoothScroll),
    )
    .toBe("lenis");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.dataset.smoothScroll ?? null,
      ),
    )
    .toBeNull();
  await page.locator('a[href="#date"]').first().click();
  await expect(page).toHaveURL(/#date/);
});
test("mobile RSVP seal never collides with the heading or response note", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/?guest=olena");
    if (await page.getByRole("dialog").count())
      await page.getByRole("button", { name: "Пропустити анімацію" }).click();
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.locator("#rsvp").scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const h = document
          .querySelector(".rsvp-intro h2")!
          .getBoundingClientRect(),
        p = document.querySelector(".rsvp-intro>p")!.getBoundingClientRect(),
        s = document.querySelector(".rsvp-stamp")!.getBoundingClientRect();
      return {
        headingBottom: h.bottom,
        sealTop: s.top,
        noteBottom: p.bottom,
        noteCenter: p.left + p.width / 2,
        sealCenter: s.left + s.width / 2,
      };
    });
    expect(geometry.sealTop).toBeGreaterThan(geometry.headingBottom);
    expect(geometry.sealTop).toBeGreaterThan(geometry.noteBottom);
    expect(Math.abs(geometry.sealCenter - geometry.noteCenter)).toBeLessThan(2);
    await page
      .locator("#rsvp")
      .screenshot({ path: `output/refinement/rsvp-${width}.png` });
  }
});
