import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://budget-begleitung.de",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (url) => !/(impressum|datenschutz|merkliste|suche|404)/.test(url),
    }),
  ],
});
