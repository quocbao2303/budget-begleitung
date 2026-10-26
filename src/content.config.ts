import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    id: z.string(),
    pillar: z.enum(["budgetieren", "begleiten", "beantragen", "beobachten"]),
    slug: z.string(),
    route: z.string(),
    title: z.string(),
    seoTitle: z.string(),
    description: z.string(),
    editorialDate: z.string(),
    datePublished: z.string(),
    factsCheckedAt: z.string(),
    format: z.string(),
    assetId: z.string(),
    author: z.enum(["benjamin", "elena", "marcus", "sophie", "julian"]),
    related: z.array(z.string()),
    sourceIds: z.array(z.string()),
    status: z.string(),
  }),
});
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    route: z.string(),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    noindex: z.boolean().default(false),
  }),
});
export const collections = { articles, pages };
