import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const article = "/budgetieren/umwandlungsanspruch/";
async function dismiss(page: any) {
  const b = page.getByRole("button", { name: "Verstanden", exact: true });
  if (await b.isVisible()) await b.click();
}
test("menu, focus return, exact/partial search and no-results", async ({
  page,
}) => {
  await page.goto("/");
  await dismiss(page);
  const menu = page.getByRole("link", { name: "Menü öffnen", exact: true });
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Alle Themen" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await page.getByRole("link", { name: "Suche öffnen", exact: true }).click();
  const query = page.getByRole("searchbox");
  await query.fill("Entlastungsbetrag");
  await expect(
    page.locator("#search-dialog .search-results article").first(),
  ).toBeVisible();
  await query.fill("Umwandlung");
  await expect(page.locator("#search-dialog .search-results")).toContainText(
    "Umwandlungsanspruch",
  );
  await query.fill("qwxyzzzzzzz");
  await expect(page.locator("#search-dialog .search-status")).toContainText(
    "Keine Treffer",
  );
  await query.fill("Pflegegeld");
  await expect(
    page.locator("#search-dialog .search-results article").first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});
test("save persists only after request, remove and clear", async ({ page }) => {
  await page.goto(article);
  await dismiss(page);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.locator(".article-aside [data-save]").click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("bb:reading-list:v1") || "[]"),
    ),
  ).toEqual(["A03"]);
  await page.reload();
  await expect(page.locator(".article-aside [data-save]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/merkliste/");
  await expect(page.locator("#saved-articles")).toContainText(
    "Umwandlungsanspruch",
  );
  await page
    .getByRole("button", { name: "Alle entfernen", exact: true })
    .click();
  await expect(page.locator("#saved-empty")).toBeVisible();
});
test("real archive pagination, filter and denied storage fallback", async ({
  page,
}) => {
  await page.goto("/magazin/");
  await dismiss(page);
  expect(await page.locator("[data-archive-grid]>.article-card").count()).toBe(
    12,
  );
  await page.getByRole("link", { name: "Weitere Beiträge" }).click();
  await expect(page.locator("[data-archive-grid]>.article-card")).toHaveCount(
    18,
  );
  const ids = await page
    .locator("[data-article]")
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.article));
  expect(new Set(ids).size).toBe(18);
  await page.locator("#pillar-filter").selectOption("begleiten");
  await expect(page.locator("[data-archive-grid]>.article-card")).toHaveCount(
    4,
  );
  await page.locator("#format-filter").selectOption("Analyse");
  await expect(page.locator("[data-archive-status]")).toContainText(
    "Keine Beiträge",
  );
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    });
  });
  await page.goto(article);
  await page.locator(".article-aside [data-save]").click();
  await expect(page.locator("#global-status")).toContainText("nicht verfügbar");
});
test("calculator input stays local, example, PG1, validation, reset and print", async ({
  page,
}) => {
  await page.goto("/budget-check/");
  await dismiss(page);
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.locator("#budget-example").click();
  await expect(page.locator('[data-result="total"]')).toContainText("729,80");
  await expect(page.locator('[data-result="remaining"]')).toContainText(
    "359,40",
  );
  await expect(page.locator('[data-result="conversion"]')).toContainText(
    "598,80",
  );
  await page.locator("#used").fill("1200");
  await page.getByRole("button", { name: "Neu berechnen" }).click();
  await expect(page.locator('[data-result="conversion"]')).toContainText(
    "297,00",
  );
  await page.locator("#grade").selectOption("1");
  await page.getByRole("button", { name: "Neu berechnen" }).click();
  await expect(page.locator('[data-result="conversion"]')).toContainText(
    "0,00",
  );
  await page.locator("#expenses").fill("-3");
  await page.getByRole("button", { name: "Neu berechnen" }).click();
  await expect(page.locator("#budget-error")).toContainText("ab 0 Euro");
  await page.getByRole("button", { name: "Eingaben zurücksetzen" }).click();
  await expect(page.locator("#budget-result")).toBeHidden();
  await page.locator("#budget-example").click();
  await page.evaluate(() => {
    (window as any).__printed = false;
    window.print = () => {
      (window as any).__printed = true;
    };
  });
  await page.getByRole("button", { name: "Rechnung drucken" }).click();
  expect(await page.evaluate(() => (window as any).__printed)).toBe(true);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(page.url()).toMatch(/\/budget-check\/$/);
});
test("reading progress ends before footer, copy and no-JS text", async ({
  page,
  browser,
}) => {
  await page.goto(article);
  await dismiss(page);
  await page.locator("#article-body").scrollIntoViewIfNeeded();
  await expect(page.locator(".reading-bar")).toHaveClass(/visible/);
  await page.locator(".article-end").scrollIntoViewIfNeeded();
  await expect(page.locator(".reading-progress")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const p = await nojs.newPage();
  await p.goto(article);
  await expect(
    p.getByRole("heading", { name: "Was umgewandelt werden kann" }),
  ).toBeVisible();
  await p.goto("/suche/");
  await p
    .getByText("Alle 18 Beiträge der Startausgabe", { exact: true })
    .click();
  await expect(
    p.getByRole("link", {
      name: "Umwandlungsanspruch: Mehr Begleitung, weniger Pflegegeld?",
      exact: true,
    }),
  ).toBeAttached();
  await nojs.close();
});
test("privacy fresh/dismiss/reload/reset, legal indexing and requests", async ({
  page,
}) => {
  const origins = new Set<string>();
  page.on("request", (r) => origins.add(new URL(r.url()).origin));
  await page.goto("/");
  await expect(page.locator(".privacy-notice")).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await dismiss(page);
  await page.reload();
  await expect(page.locator(".privacy-notice")).toBeHidden();
  await page.goto("/datenschutz/einstellungen/");
  await page.getByRole("button", { name: "Hinweis erneut anzeigen" }).click();
  await expect(page.locator(".privacy-notice")).toBeVisible();
  for (const route of [
    "/impressum/",
    "/datenschutz/",
    "/datenschutz/einstellungen/",
  ]) {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,follow",
    );
  }
  expect([...origins]).toEqual(["http://localhost:4321"]);
});
test("accessibility on major page families and overlays", async ({ page }) => {
  const results = [];
  for (const route of [
    "/",
    "/magazin/",
    article,
    "/budget-check/",
    "/anbieter-check/",
    "/ueber-uns/",
    "/datenschutz/",
    "/bildgeschichten/vom-anspruch-zur-entlastung/",
  ]) {
    await page.goto(route);
    await dismiss(page);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    results.push({ route, violations: result.violations });
  }
  await page.goto("/");
  await page.getByRole("link", { name: "Menü öffnen", exact: true }).click();
  results.push({
    route: "menu",
    violations: (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  });
  fs.writeFileSync(
    "artifacts/qa/accessibility.json",
    JSON.stringify(results, null, 2),
  );
  expect(
    results.flatMap((x) => x.violations.map((v) => x.route + ": " + v.id)),
  ).toEqual([]);
});

test("production CSP permits local WebAssembly search", async ({ page }) => {
  const headers = fs.readFileSync(
    "artifacts/release/security-headers.conf",
    "utf8",
  );
  const policy = headers.match(/Content-Security-Policy "([^"]+)"/)![1];
  await page.route("**/*", async (route) => {
    const response = await route.fetch();
    const h = response.headers();
    if (h["content-type"]?.includes("text/html"))
      await route.fulfill({
        response,
        headers: { ...h, "content-security-policy": policy },
      });
    else await route.fulfill({ response });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await dismiss(page);
  await page.getByRole("link", { name: "Suche öffnen", exact: true }).click();
  await page.getByRole("searchbox").fill("Umwandlung");
  await expect(
    page.locator("#search-dialog .search-results article").first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
