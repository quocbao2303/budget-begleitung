import { getCollection, type CollectionEntry } from "astro:content";
export type Article = CollectionEntry<"articles">;
export async function articles() {
  return (await getCollection("articles")).sort((a, b) =>
    a.data.id.localeCompare(b.data.id),
  );
}
export const pillars = [
  {
    id: "budgetieren",
    name: "Budgetieren",
    title: "Die Rechnung verstehen",
    intro:
      "Welche Leistung bezahlt welche Unterstützung? Hier sortieren wir Pflegegeld, Sachleistungen und Entlastungsbetrag. Die Beispiele zeigen neben einem möglichen Rahmen auch die Grenzen und die Wirkung auf andere Leistungen.",
  },
  {
    id: "begleiten",
    name: "Begleiten",
    title: "Hilfe, die zum Alltag passt",
    intro:
      "Pflegebegleitung kann Verschiedenes bedeuten. Wir erklären Aufgaben, Kosten und Formen der Unterstützung. Bevor Sie ein Angebot beurteilen, sollten Leistung, Verlässlichkeit und Finanzierungsweg zusammenpassen.",
  },
  {
    id: "beantragen",
    name: "Beantragen",
    title: "Vom offenen Punkt zum nächsten Schritt",
    intro:
      "Eine vollständige Rechnung, eine geklärte Anerkennung oder ein dokumentierter Antragseingang helfen mehr als ein weiteres unverständliches Formularwort. Diese Anleitungen begleiten die praktischen Schritte.",
  },
  {
    id: "beobachten",
    name: "Beobachten",
    title: "Was sich wirklich ändert",
    intro:
      "Entwurf, Beschluss und geltendes Recht sind verschiedene Dinge. Wir prüfen Reformmeldungen auf ihre Bedeutung für den Haushalt und halten geplante Leistungen von heutigen Ansprüchen getrennt.",
  },
];
export const authors = {
  benjamin: {
    name: "Benjamin Schmidt",
    role: "Herausgeber & Chefredakteur",
    bio: "Fachjournalist für Sozial- und Gesundheitspolitik. Er verantwortet die redaktionelle Gesamtleitung und Verbraucheraufklärung.",
  },
  elena: {
    name: "Elena Weber",
    role: "Budgetieren & Recht",
    bio: "Volljuristin mit Beratungserfahrung im Sozialversicherungsrecht. Sie übersetzt komplexe Paragrafen in klare Rechenmodelle.",
  },
  marcus: {
    name: "Marcus Bergmann",
    role: "Begleiten & Alltag",
    bio: "Ehemaliger Leiter eines anerkannten Alltagsunterstützungsdienstes. Er schreibt über die praktische Organisation von Begleitung.",
  },
  sophie: {
    name: "Sophie Lindemann",
    role: "Beantragen & Kassenpraxis",
    bio: "Pflegeberaterin nach § 7a SGB XI. Ihr Schwerpunkt sind Anträge, Abrechnung und nachvollziehbare nächste Schritte.",
  },
  julian: {
    name: "Dr. Julian Krause",
    role: "Beobachten & Politik",
    bio: "Gesundheitsökonom. Er analysiert gesetzliche Reformvorhaben und ihre Bedeutung für private Pflegehaushalte.",
  },
};
export const minutes = (a: Article) =>
  Math.max(2, Math.ceil((a.body || "").split(/\s+/).length / 190));
export const date = (s: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(new Date(s + "T12:00:00Z"));
export const pillarName = (s: string) =>
  pillars.find((p) => p.id === s)?.name || s;
export const imageAlt: Record<string, string> = {
  "budget-wege-hero":
    "Ein heller Papierpfad führt durch eine Landschaft aus gefalteten Akten und mineralblauen Hügeln.",
  "toepfe-verbinden":
    "Getrennte Gefäße und Papierkanäle veranschaulichen unterschiedliche Finanzierungswege.",
  "anerkennung-bruecke":
    "Ein Dokument bildet das passende fehlende Stück einer Papierbrücke.",
  "antrag-schritte": "Breite Papierterrassen bilden einen übersichtlichen Weg.",
  "begleitung-alltag":
    "Zwei erwachsene Figuren begegnen sich auf einem gemeinsamen Weg.",
  "reform-baustelle": "Ein noch veränderbares Architekturmodell aus Papier.",
  "budget-stroemung": "Petrolfarbene und mintgrüne Pigmentströme.",
  "klarer-horizont":
    "Ein heller Bogen über einer ruhigen mineralblauen Landschaft.",
};
