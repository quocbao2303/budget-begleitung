import { chromium } from "@playwright/test";
import fs from "node:fs";
import { Resolver } from "node:dns/promises";
const origin = "https://budget-begleitung.de";
// Isolated verification context uses the newly authoritative DNS answer while older resolver caches expire.
const resolver = new Resolver();
resolver.setServers(["1.1.1.1"]);
const [currentIp] = await resolver.resolve4("budget-begleitung.de");
const browser = await chromium.launch({
  headless: true,
  args: [
    `--host-resolver-rules=MAP budget-begleitung.de ${currentIp}, MAP www.budget-begleitung.de ${currentIp}`,
  ],
});
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await desktop.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const routes = [
  "/",
  "/budgetieren/umwandlungsanspruch/",
  "/budget-check/",
  "/magazin/",
  "/ueber-uns/",
  "/impressum/",
  "/datenschutz/",
];
const checks = [];
for (const route of routes) {
  const response = await page.goto(origin + route);
  const btn = page.getByRole("button", { name: "Verstanden", exact: true });
  if (await btn.isVisible()) await btn.click();
  checks.push({
    route,
    status: response.status(),
    title: await page.title(),
    csp: !!response.headers()["content-security-policy"],
  });
}
await page.goto(origin + "/");
await page.screenshot({ path: "artifacts/qa/live-home-1440.png" });
await page.getByRole("link", { name: "Suche öffnen", exact: true }).click();
await page.getByRole("searchbox").fill("Entlastungsbetrag");
await page.locator("#search-dialog .search-results article").first().waitFor();
checks.push({ flow: "live Pagefind search", passed: true });
await page.keyboard.press("Escape");
await page.goto(origin + "/budget-check/");
await page.locator("#budget-example").click();
checks.push({
  flow: "live calculator",
  passed: (await page.locator("[data-result=total]").innerText()).includes(
    "729,80",
  ),
});
await page.screenshot({ path: "artifacts/qa/live-budget-1440.png" });
await page.goto(origin + "/budgetieren/umwandlungsanspruch/");
await page.locator(".article-aside [data-save]").click();
checks.push({
  flow: "live reading list",
  passed:
    (await page
      .locator(".article-aside [data-save]")
      .getAttribute("aria-pressed")) === "true",
});
await page.getByRole("link", { name: "Menü öffnen", exact: true }).click();
await page.screenshot({ path: "artifacts/qa/live-menu-1440.png" });
await page.keyboard.press("Escape");
const www = await page.goto("https://www.budget-begleitung.de/");
checks.push({
  flow: "www redirect",
  passed: page.url() === origin + "/",
  status: www.status(),
});
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
});
const mp = await mobile.newPage();
await mp.addInitScript(() => {
  window.__lab = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__lab.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      if (!e.hadRecentInput) window.__lab.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
});
const cdp = await mobile.newCDPSession(mp);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1600 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await mp.goto(origin + "/");
await mp.waitForLoadState("networkidle");
await mp.evaluate(() => document.fonts.ready);
const metrics = await mp.evaluate(() => ({
  lcpMs: window.__lab.lcp,
  cls: window.__lab.cls,
  transferBytes: performance
    .getEntriesByType("resource")
    .reduce((n, e) => n + e.transferSize, 0),
  resourceCount: performance.getEntriesByType("resource").length,
  thirdPartyRequests: performance
    .getEntriesByType("resource")
    .filter((e) => new URL(e.name).origin !== location.origin)
    .map((e) => e.name),
  viewport: { width: innerWidth, height: innerHeight },
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
}));
await mp.getByRole("button", { name: "Verstanden", exact: true }).click();
await mp.screenshot({ path: "artifacts/qa/live-home-390.png" });
await mp.goto(origin + "/ueber-uns/");
await mp.screenshot({
  path: "artifacts/qa/live-about-390.png",
  fullPage: true,
});
const report = {
  origin,
  checkedAt: new Date().toISOString(),
  dns: "New authoritative A answer pinned in isolated test browser; normal DNS caches may still resolve prior parking addresses.",
  conditions:
    "Chromium headless, mobile390x844 DPR1, 150ms latency, 1.6Mbps down, 750Kbps up, 4x CPU slowdown. Cold browser context. Single lab sample; not field INP evidence.",
  checks,
  errors,
  mobile: metrics,
};
fs.writeFileSync(
  "artifacts/qa/live-verification.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || checks.some((c) => c.passed === false || c.status >= 400))
  process.exitCode = 1;
