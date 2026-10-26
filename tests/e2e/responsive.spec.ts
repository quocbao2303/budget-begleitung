import { test, expect } from "@playwright/test";
import fs from "node:fs";
const core = [
  [390, 844],
  [740, 1000],
  [768, 1024],
  [1080, 900],
  [1300, 900],
  [1440, 1000],
  [1680, 1050],
];
const extras = [
  [320, 780],
  [360, 800],
  [739, 900],
  [1079, 900],
  [1299, 900],
  [1439, 900],
  [1679, 1000],
  [1920, 1080],
  [1440, 650],
];
const routes = [
  ["home", "/"],
  ["archive", "/magazin/"],
  ["article", "/budgetieren/umwandlungsanspruch/"],
  ["budget", "/budget-check/"],
  ["story", "/bildgeschichten/vom-anspruch-zur-entlastung/"],
  ["about", "/ueber-uns/"],
  ["privacy", "/datenschutz/"],
];
test("responsive template matrix and sticky release", async ({ page }) => {
  test.setTimeout(180000);
  const results = [];
  for (const [name, route] of routes) {
    for (const [width, height] of core) {
      await page.setViewportSize({ width, height });
      await page.goto(route);
      const dismiss = page.getByRole("button", {
        name: "Verstanden",
        exact: true,
      });
      if (await dismiss.isVisible()) await dismiss.click();
      await page.evaluate(() => document.fonts.ready);
      const dims = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        height: innerHeight,
      }));
      results.push({ name, ...dims });
      await page.screenshot({ path: `artifacts/qa/${name}-${width}-top.png` });
      expect.soft(dims.scroll, `${name}@${width}`).toBeLessThanOrEqual(width);
    }
  }
  for (const [width, height] of extras) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const dims = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    results.push({ name: "home-extra", ...dims });
    expect
      .soft(dims.scroll, `home@${width}x${height}`)
      .toBeLessThanOrEqual(width);
    await page.screenshot({ path: `artifacts/qa/home-${width}x${height}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const positions = [];
  for (const y of [0, 500, 1000, 1600, 2200]) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: "instant" }),
      y,
    );
    const coords = await page
      .locator(".lead-inner")
      .evaluateAll((els) =>
        els.map((el) => ({
          y: el.getBoundingClientRect().top,
          height: el.getBoundingClientRect().height,
        })),
      );
    positions.push({ scroll: y, coords });
    await page.screenshot({ path: `artifacts/qa/home-sticky-${y}.png` });
  }
  fs.writeFileSync(
    "artifacts/qa/responsive.json",
    JSON.stringify({ results, positions }, null, 2),
  );
  expect(positions[2].coords[0].y).toBe(22);
  expect(positions[4].coords[0].y).toBeLessThan(22);
  for (const [name, route] of routes) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await page.screenshot({
      path: `artifacts/qa/${name}-390-full.png`,
      fullPage: true,
    });
  }
  await page.goto("/");
  await page.getByRole("link", { name: "Menü öffnen", exact: true }).click();
  await page.screenshot({ path: "artifacts/qa/menu-390.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Suche öffnen", exact: true }).click();
  await page.screenshot({ path: "artifacts/qa/search-390.png" });
});
