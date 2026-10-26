import { articles } from "../lib/content";
const esc = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export async function GET() {
  const all = await articles();
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Budget Begleitung</title><link>https://budget-begleitung.de/</link><description>Pflegebegleitung finanzieren. Klar. Clever. Unabhängig.</description><language>de-de</language>${all
      .reverse()
      .map(
        (a) =>
          `<item><title>${esc(a.data.title)}</title><link>https://budget-begleitung.de${a.data.route}</link><guid>https://budget-begleitung.de${a.data.route}</guid><description>${esc(a.data.description)}</description><pubDate>${new Date(a.data.datePublished + "T12:00:00+01:00").toUTCString()}</pubDate></item>`,
      )
      .join("")}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
