import { test, expect, type Page } from "@playwright/test";

async function open(page: Page, guest = "olena") {
  await page.goto(`/?guest=${guest}`);
  if (await page.getByRole("dialog").count())
    await page.getByRole("button", { name: "Пропустити анімацію" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

test("secret notes and memories work by keyboard; rings are automatic and static with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const note = page.getByRole("button", {
    name: "Секрет у листі",
    exact: true,
  });
  await note.focus();
  await page.keyboard.press("Enter");
  await expect(note).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".secret-paper")).toContainText("Ми дуже щасливі");
  await page.keyboard.press("Escape");
  await expect(note).toBeFocused();
  await expect(note).toHaveAttribute("aria-expanded", "false");
  await note.click();
  await page.locator(".letter-closing").click();
  await expect(note).toHaveAttribute("aria-expanded", "false");
  const photo = page.getByRole("button", {
    name: "Відкрити підпис до фотографії",
  });
  await photo.click();
  for (const [i, title] of [
    "Перша зустріч",
    "Наші маленькі пригоди",
    "Той самий момент",
    "Назавжди разом",
  ].entries()) {
    await page
      .getByRole("tab", { name: ["2019", "2021", "2025", "2026"][i] })
      .click();
    await expect(page.locator("#photo-memory")).toContainText(title);
  }
  await page.locator(".ring-interaction").scrollIntoViewIfNeeded();
  await expect(page.locator(".ring-interaction")).toHaveAttribute("data-joined", "true");
  await expect(page.locator(".ring-interaction button")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Дві золоті обручки поєднуються — символ нашого назавжди" })).toBeVisible();
  await expect(page.locator(".ring-interaction > p")).toHaveText("Дві історії — одне назавжди");
});

test("wish validates, saves once, reloads, edits and remains separate per guest and from RSVP", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.evaluate(() => localStorage.setItem("ma-rsvp-v1", "[]"));
  await page
    .getByRole("button", { name: "Зірка 2: залишити побажання" })
    .click();
  const field = page.getByRole("textbox", { name: "Ваше побажання" });
  await expect(field).toBeFocused();
  await page.getByRole("button", { name: "Зберегти побажання" }).click();
  await expect(page.getByRole("alert")).toContainText("щонайменше 3");
  await field.fill("   Нехай ваша любов розквітає щодня.   ");
  await page.getByRole("button", { name: "Зберегти побажання" }).click();
  await expect(page.getByRole("status")).toContainText("Ваша зірка засяяла");
  await expect(page.getByRole("status")).toContainText("Нехай ваша любов");
  await page.getByRole("button", { name: "Редагувати побажання" }).click();
  await expect(field).toHaveValue("   Нехай ваша любов розквітає щодня.   ");
  await field.fill("Щастя й затишку вашому дому!");
  await page.getByRole("button", { name: "Зберегти побажання" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Зірка 2: ваше побажання" }).click();
  await expect(field).toHaveValue("Щастя й затишку вашому дому!");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Зірка 2: ваше побажання" }),
  ).toBeFocused();
  await expect(page.locator(".wish-paper")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Зірка 4: залишити побажання" })
    .click();
  await page.getByRole("button", { name: "Зберегти побажання" }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ma-wishes-v1")!),
    ),
  ).toHaveLength(1);
  expect(await page.evaluate(() => localStorage.getItem("ma-rsvp-v1"))).toBe(
    "[]",
  );
  await open(page, "couple");
  await page
    .getByRole("button", { name: "Зірка 1: залишити побажання" })
    .click();
  await expect(field).toHaveValue("");
  await field.fill("Кохання на все життя!");
  await page.getByRole("button", { name: "Зберегти побажання" }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ma-wishes-v1")!),
    ),
  ).toHaveLength(2);
});

test("wish storage failure is honest and retains the draft; malformed storage is safe", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.evaluate(() => {
    localStorage.setItem("ma-wishes-v1", "broken");
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  await page
    .getByRole("button", { name: "Зірка 1: залишити побажання" })
    .click();
  await page
    .getByRole("textbox", { name: "Ваше побажання" })
    .fill("Нехай здійсняться всі мрії!");
  await page.getByRole("button", { name: "Зберегти побажання" }).click();
  await expect(page.getByRole("alert")).toContainText("Не вдалося зберегти");
  await expect(
    page.getByRole("textbox", { name: "Ваше побажання" }),
  ).toHaveValue("Нехай здійсняться всі мрії!");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("decorations draw with scrolling, light glints pause offscreen, and live reduced motion removes movement", async ({
  page,
}) => {
  await open(page);
  const ink = page.locator(".fate-ink");
  const start = await ink.evaluate((el) =>
    parseFloat(getComputedStyle(el).strokeDashoffset),
  );
  await page.locator("#story").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const middle = await ink.evaluate((el) =>
    parseFloat(getComputedStyle(el).strokeDashoffset),
  );
  expect(middle).toBeLessThan(start);
  await page.locator("#wishes").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  expect(
    await ink.evaluate((el) =>
      parseFloat(getComputedStyle(el).strokeDashoffset),
    ),
  ).toBeLessThan(middle);
  await expect(page.locator(".hero .ghost-fibers-container")).toHaveAttribute(
    "data-running",
    "false",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".light-scene:visible")).toHaveCount(0);
  expect(
    await ink.evaluate((el) =>
      parseFloat(getComputedStyle(el).strokeDashoffset),
    ),
  ).toBe(0);
  await expect
    .poll(() =>
      page
        .locator(".botanical path")
        .first()
        .evaluate((el) =>
          parseFloat(el.getAttribute("stroke-dashoffset") || "0"),
        ),
    )
    .toBe(0);
});

test("interactive scenes fit all requested widths and keep controls reachable", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    for (const id of ["letter", "story", "date", "wishes"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      if (id === "story")
        await page
          .getByRole("button", { name: "Відкрити підпис до фотографії" })
          .click();
      if (id === "wishes") {
        await page
          .getByRole("button", { name: "Зірка 3: залишити побажання" })
          .click();
        await page
          .getByRole("textbox", { name: "Ваше побажання" })
          .fill("Безмежного щастя вам обом!");
        await page.getByRole("button", { name: "Зберегти побажання" }).click();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const outside = await page
        .locator(`#${id} button`)
        .evaluateAll((elements) =>
          elements
            .filter((el) => {
              const b = el.getBoundingClientRect();
              return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
            })
            .map((el) => el.getAttribute("aria-label") || el.textContent),
        );
      expect(outside).toEqual([]);
      await page
        .locator(`#${id}`)
        .screenshot({ path: `output/interactive/${id}-${width}.png` });
    }
    await page.evaluate(() => localStorage.removeItem("ma-wishes-v1"));
  }
  expect(errors).toEqual([]);
});

for (const width of [390, 1440]) test(`rings follow scrolling and live reduced motion at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page);
  const left = page.locator('.ring-left');
  const position = () => left.getAttribute('transform');
  const scrollToProgress = async (progress: number) => {
    await page.evaluate((progress) => {
      const ring = document.querySelector('.ring-interaction')!;
      const rect = ring.getBoundingClientRect();
      const center = rect.top + scrollY + rect.height / 2;
      window.scrollTo({ top: center - innerHeight * (.85 - .5 * progress), behavior: 'instant' });
    }, progress);
    await page.waitForTimeout(800);
  };
  await scrollToProgress(0);
  const start = await position();
  await scrollToProgress(.5);
  const middle = await position();
  expect(middle).not.toBe(start);
  await scrollToProgress(1);
  const end = await position();
  expect(end).not.toBe(middle);
  expect(end).toBe("translate(100 64) rotate(0)");
  await expect(page.locator('.ring-interaction')).toHaveAttribute('data-joined', 'true');
  await scrollToProgress(0);
  expect(await position()).toBe(start);
  await expect(page.locator('.ring-interaction')).toHaveAttribute('data-joined', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(left).toHaveAttribute('transform', 'translate(100 64)');
  await scrollToProgress(1);
  await expect(left).toHaveAttribute('transform', 'translate(100 64)');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await scrollToProgress(0);
  expect(await position()).toBe(start);
});
