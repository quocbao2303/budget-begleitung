import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function sitemapXml() {
  return {
    name: "sitemap-xml",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const destDir = fileURLToPath(dir);
        const s0 = path.join(destDir, "sitemap-0.xml");
        const sXml = path.join(destDir, "sitemap.xml");
        if (fs.existsSync(s0)) {
          fs.copyFileSync(s0, sXml);
          logger.info("`sitemap.xml` created from `sitemap-0.xml`");
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://budget-begleitung.de",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (url) => !/(impressum|datenschutz|merkliste|suche|404)/.test(url),
    }),
    sitemapXml(),
  ],
});
