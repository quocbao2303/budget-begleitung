import { articles, minutes } from "../lib/content";
export async function GET() {
  return new Response(
    JSON.stringify(
      (await articles()).map((a) => ({
        id: a.data.id,
        title: a.data.title,
        description: a.data.description,
        route: a.data.route,
        pillar: a.data.pillar,
        format: a.data.format,
        assetId: a.data.assetId,
        minutes: minutes(a),
      })),
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } },
  );
}
