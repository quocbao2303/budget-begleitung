import fs from "node:fs";
import path from "node:path";
const files = fs
  .readdirSync("dist", { recursive: true })
  .filter((x) => x.endsWith(".html"));
const errors = [];
const external = [];
let articles = 0;
for (const f of files) {
  const html = fs.readFileSync(path.join("dist", f), "utf8");
  if (html.includes("—")) errors.push(f + ": em dash");
  const h1 = html.match(/<h1(?:\s|>)/g) || [];
  if (h1.length !== 1) errors.push(f + ": expected one h1, got " + h1.length);
  if (!html.includes('lang="de"')) errors.push(f + ": German language absent");
  if (/(?:\.env|NORTHFLANK_API_TOKEN|FAL_KEY)/.test(html))
    errors.push(f + ": secret marker");
  if (html.includes('id="article-body"')) articles++;
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)) {
    const href = m[1].replace(/&amp;/g, "&");
    if (/^https?:/.test(href)) {
      if (!href.startsWith("https://budget-begleitung.de/"))
        external.push({ file: f, href, tag: m[0] });
      continue;
    }
    if (href.startsWith("/") && !href.startsWith("//")) {
      const clean = decodeURIComponent(href.split(/[?#]/)[0]);
      let target = path.join("dist", clean);
      if (clean.endsWith("/")) target = path.join(target, "index.html");
      if (!fs.existsSync(target)) errors.push(f + ": missing link " + href);
    }
  }
  for (const m of html.matchAll(
    /(?:src|href)="(\/(?:media|fonts|_astro)\/[^"?#]+)"/g,
  ))
    if (!fs.existsSync(path.join("dist", m[1])))
      errors.push(f + ": missing asset " + m[1]);
  if (
    /^(?:impressum|datenschutz|merkliste|suche)(?:\/|\.)/.test(f) &&
    !html.includes("noindex,follow")
  )
    errors.push(f + ": expected noindex");
}
if (articles !== 18) errors.push("Expected 18 articles, found " + articles);
if (external.length !== 6 || new Set(external.map((x) => x.href)).size !== 6)
  errors.push(
    "Expected six unique external link occurrences, got " + external.length,
  );
if (external.some((x) => /nofollow|sponsored|ugc/.test(x.tag)))
  errors.push("Non-followed launch source");
const sitemap = fs.readFileSync("dist/sitemap-0.xml", "utf8");
if (/impressum|datenschutz|merkliste|suche|404/.test(sitemap))
  errors.push("Excluded route in sitemap");
if (!fs.existsSync("dist/sitemap.xml")) {
  errors.push("Missing dist/sitemap.xml");
} else {
  const sitemapXml = fs.readFileSync("dist/sitemap.xml", "utf8");
  if (/impressum|datenschutz|merkliste|suche|404/.test(sitemapXml))
    errors.push("Excluded route in sitemap.xml");
}
if (fs.existsSync("dist/404.html")) {
  errors.push("Unexpected 404.html in dist (404 page should be removed)");
}
for (const bad of [".env", "docs", "reference", "assets-source", ".git"])
  if (fs.existsSync("dist/" + bad)) errors.push("Private path in dist: " + bad);
fs.mkdirSync("artifacts/qa", { recursive: true });
const report = {
  checkedAt: new Date().toISOString(),
  htmlPages: files.length,
  articles,
  external: external.map(({ file, href }) => ({ file, href })),
  errors,
};
fs.writeFileSync(
  "artifacts/qa/output-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    { pages: files.length, articles, externalLinks: external.length, errors },
    null,
    2,
  ),
);
if (errors.length) process.exitCode = 1;
