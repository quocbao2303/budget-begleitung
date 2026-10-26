export {};
type ArticleMeta = {
  id: string;
  route: string;
  title: string;
  description: string;
  pillar: string;
  format: string;
  assetId: string;
  minutes: number;
};
const status = document.querySelector<HTMLElement>("#global-status")!;
const announce = (text: string) => {
  status.textContent = "";
  setTimeout(() => (status.textContent = text), 20);
};
let trigger: HTMLElement | null = null;
let scrollY = 0;
function closeDialog(dialog: HTMLDialogElement) {
  dialog.close();
}
document.querySelectorAll<HTMLElement>("[data-open]").forEach((el) =>
  el.addEventListener("click", (event) => {
    const dialog = document.getElementById(
      el.dataset.open!,
    ) as HTMLDialogElement | null;
    if (!dialog) return;
    event.preventDefault();
    document
      .querySelectorAll<HTMLDialogElement>("dialog[open]")
      .forEach((d) => d.close());
    trigger = el;
    scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    if (dialog.id === "search-dialog") dialog.querySelector("input")?.focus();
    if (dialog.id === "saved-dialog") updateSavedSummary();
  }),
);
document.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) => {
  dialog
    .querySelectorAll("[data-close]")
    .forEach((btn) => btn.addEventListener("click", () => closeDialog(dialog)));
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    trigger?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollY, behavior: "instant" });
  });
});
const privacyKey = "bb:privacy-notice:v1",
  savedKey = "bb:reading-list:v1";
const notice = document.querySelector<HTMLElement>(".privacy-notice")!;
try {
  notice.hidden = sessionStorage.getItem(privacyKey) === "dismissed";
} catch {
  notice.hidden = false;
}
document.querySelector("#dismiss-privacy")?.addEventListener("click", () => {
  notice.hidden = true;
  try {
    sessionStorage.setItem(privacyKey, "dismissed");
  } catch {
    announce(
      "Hinweis für diese Ansicht geschlossen. Der Sitzungsspeicher ist nicht verfügbar.",
    );
  }
});
document.querySelector("#reset-notice")?.addEventListener("click", () => {
  try {
    sessionStorage.removeItem(privacyKey);
  } catch {}
  notice.hidden = false;
  announce("Der Informationshinweis wird wieder angezeigt.");
});
let memorySaved: string[] = [];
function readSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(savedKey) || "[]");
    return Array.isArray(v)
      ? v.filter((x) => typeof x === "string" && /^A\d{2}$/.test(x))
      : [];
  } catch {
    return memorySaved;
  }
}
function writeSaved(ids: string[]) {
  memorySaved = ids;
  try {
    if (ids.length) localStorage.setItem(savedKey, JSON.stringify(ids));
    else localStorage.removeItem(savedKey);
    return true;
  } catch {
    return false;
  }
}
function syncSaved() {
  const ids = readSaved();
  document.querySelectorAll<HTMLButtonElement>("[data-save]").forEach((btn) => {
    const active = ids.includes(btn.dataset.save!);
    btn.setAttribute("aria-pressed", String(active));
    btn.setAttribute(
      "aria-label",
      active ? "Aus Merkliste entfernen" : "Artikel merken",
    );
    btn.classList.toggle("is-saved", active);
  });
}
document.querySelectorAll<HTMLButtonElement>("[data-save]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const ids = readSaved();
    const id = btn.dataset.save!;
    const active = ids.includes(id);
    const stored = writeSaved(
      active ? ids.filter((i) => i !== id) : [...ids, id],
    );
    syncSaved();
    announce(
      stored
        ? active
          ? "Artikel aus der Merkliste entfernt."
          : "Artikel in diesem Browser gemerkt."
        : "Browserspeicher nicht verfügbar. Ihre Auswahl bleibt nur in dieser Ansicht.",
    );
  }),
);
syncSaved();
window.addEventListener("storage", () => {
  syncSaved();
  renderSavedPage();
});
let metaPromise: Promise<ArticleMeta[]> | undefined;
const metadata = () =>
  (metaPromise ||= fetch("/articles.json")
    .then((r) => {
      if (!r.ok) throw Error("Laden fehlgeschlagen");
      return r.json() as Promise<ArticleMeta[]>;
    })
    .catch((e) => {
      metaPromise = undefined;
      throw e;
    }));
async function updateSavedSummary() {
  const el = document.querySelector<HTMLElement>("[data-saved-summary]")!;
  const count = readSaved().length;
  el.replaceChildren();
  const h = document.createElement("p");
  h.className = "saved-heading";
  h.textContent = count
    ? `${count} ${count === 1 ? "Beitrag" : "Beiträge"} für später.`
    : "Gutes für später.";
  const p = document.createElement("p");
  p.textContent = count
    ? "Ihre Auswahl ist lokal in diesem Browser gespeichert."
    : "Merken Sie sich Beiträge mit dem Lesezeichen am Artikel. Ihre Auswahl bleibt in diesem Browser.";
  el.append(h, p);
}
async function renderSavedPage() {
  const el = document.querySelector<HTMLElement>("#saved-articles");
  if (!el) return;
  const ids = readSaved();
  el.replaceChildren();
  const empty = document.querySelector<HTMLElement>("#saved-empty")!;
  empty.hidden = ids.length > 0;
  document.querySelector<HTMLElement>("#clear-saved")!.hidden = !ids.length;
  if (!ids.length) return;
  try {
    const all = await metadata();
    for (const a of all.filter((a) => ids.includes(a.id))) {
      const li = document.createElement("li");
      const h = document.createElement("h2");
      const link = document.createElement("a");
      link.href = a.route;
      link.textContent = a.title;
      h.append(link);
      const btn = document.createElement("button");
      btn.className = "button outline";
      btn.textContent = "Entfernen";
      btn.setAttribute("aria-label", a.title + " aus Merkliste entfernen");
      btn.addEventListener("click", () => {
        writeSaved(readSaved().filter((i) => i !== a.id));
        renderSavedPage();
        announce("Beitrag entfernt.");
      });
      li.append(h, btn);
      el.append(li);
    }
  } catch {
    const p = document.createElement("p");
    p.textContent =
      "Die Beitragsliste konnte nicht geladen werden. Bitte laden Sie die Seite erneut.";
    el.append(p);
  }
}
renderSavedPage();
document.querySelectorAll<HTMLElement>("[data-clear-saved]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const success = writeSaved([]);
    syncSaved();
    renderSavedPage();
    announce(
      success
        ? "Merkliste in diesem Browser geleert."
        : "Der Browserspeicher ist blockiert. Es konnten keine gespeicherten Angaben gelöscht werden.",
    );
  }),
);
document
  .querySelectorAll<HTMLElement>("[data-print]")
  .forEach((btn) => btn.addEventListener("click", () => window.print()));
document.querySelectorAll<HTMLElement>("[data-copy]").forEach((btn) =>
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.origin + location.pathname);
      announce("Artikellink kopiert.");
    } catch {
      announce(
        "Der Link konnte nicht kopiert werden. Sie können die Adresse aus der Adressleiste kopieren.",
      );
    }
  }),
);
// Only load the static search bundle after a search intent. Never render query HTML.
const searchBundlePath = "/pagefind/pagefind.js";
let pagefind: Promise<any> | undefined;
const loadSearch = () =>
  (pagefind ||= import(/* @vite-ignore */ searchBundlePath).catch((e) => {
    pagefind = undefined;
    throw e;
  }));
document.querySelectorAll<HTMLElement>("[data-search]").forEach((area) => {
  const input = area.querySelector<HTMLInputElement>("input")!;
  const results = area.querySelector<HTMLElement>(".search-results")!;
  const label = area.querySelector<HTMLElement>(".search-status")!;
  let timer: ReturnType<typeof setTimeout>;
  let sequence = 0;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const thisSeq = ++sequence;
    const q = input.value.trim();
    results.replaceChildren();
    if (!q) {
      label.textContent = "";
      return;
    }
    label.textContent = "Suche läuft …";
    timer = setTimeout(async () => {
      try {
        const pf = await loadSearch();
        const found = await pf.search(q);
        const data = await Promise.all(
          found.results.slice(0, 12).map((r: any) => r.data()),
        );
        if (thisSeq !== sequence) return;
        label.textContent = found.results.length
          ? `${found.results.length} Treffer`
          : "Keine Treffer. Versuchen Sie einen anderen Begriff oder wählen Sie ein Thema.";
        for (const item of data) {
          const article = document.createElement("article");
          const h = document.createElement("h3");
          const link = document.createElement("a");
          link.href = item.url;
          link.textContent = item.meta.title;
          h.append(link);
          const p = document.createElement("p");
          const doc = new DOMParser().parseFromString(
            item.excerpt,
            "text/html",
          );
          p.textContent = doc.body.textContent;
          article.append(h, p);
          results.append(article);
        }
      } catch {
        if (thisSeq !== sequence) return;
        label.textContent =
          "Die Suche konnte nicht geladen werden. Prüfen Sie die Verbindung und versuchen Sie es erneut.";
        const retry = document.createElement("button");
        retry.className = "button outline";
        retry.textContent = "Erneut versuchen";
        retry.addEventListener("click", () =>
          input.dispatchEvent(new Event("input")),
        );
        results.append(retry);
      }
    }, 200);
  });
});
const body = document.querySelector<HTMLElement>("#article-body");
const bar = document.querySelector<HTMLElement>(".reading-bar");
if (body && bar) {
  const progress = bar.querySelector<HTMLElement>(".reading-progress")!;
  let start = 0,
    end = 1,
    ticking = false;
  const measure = () => {
    const r = body.getBoundingClientRect();
    start = r.top + window.scrollY - 90;
    end = start + body.offsetHeight - window.innerHeight + 150;
    update();
  };
  const update = () => {
    const y = window.scrollY;
    bar.classList.toggle("visible", y > start - 90);
    const p = Math.max(
      0,
      Math.min(100, ((y - start) / Math.max(1, end - start)) * 100),
    );
    progress.style.width = p + "%";
    progress.setAttribute("aria-valuenow", String(Math.round(p)));
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", measure);
  new ResizeObserver(measure).observe(body);
  document.fonts.ready.then(measure);
  measure();
}
// Preserve natural document scrolling, allowing tall side panels to enter the viewport.
const essentials = document.querySelector<HTMLElement>(
  ".lead-essentials-column .lead-inner",
);
if (essentials) {
  const measure = () => {
    essentials.style.top =
      Math.min(22, window.innerHeight - essentials.offsetHeight - 22) + "px";
  };
  new ResizeObserver(measure).observe(essentials);
  window.addEventListener("resize", measure);
  measure();
}
const more = document.querySelector<HTMLAnchorElement>("[data-load-more]");
more?.addEventListener("click", async (e) => {
  e.preventDefault();
  more.setAttribute("aria-busy", "true");
  try {
    const r = await fetch(more.href);
    if (!r.ok) throw Error();
    const doc = new DOMParser().parseFromString(await r.text(), "text/html");
    const grid = document.querySelector<HTMLElement>("[data-archive-grid]")!;
    const current = new Set(
      [...grid.querySelectorAll<HTMLElement>("[data-article]")].map(
        (el) => el.dataset.article,
      ),
    );
    let count = 0;
    doc
      .querySelectorAll<HTMLElement>("[data-archive-grid]>.article-card")
      .forEach((card) => {
        if (!current.has(card.dataset.article)) {
          grid.append(document.importNode(card, true));
          count++;
        }
      });
    more.hidden = true;
    const pagination = more.closest(".pagination");
    if (pagination) {
      const info = pagination.querySelector(".eyebrow");
      if (info) info.textContent = "Alle 18 Beiträge geladen";
    }
    document.querySelector<HTMLElement>("[data-archive-status]")!.textContent =
      `${count} weitere Beiträge geladen. Alle Beiträge der Startausgabe sind sichtbar.`;
  } catch {
    more.removeAttribute("data-load-more");
    more.textContent = "Seite 2 öffnen ↗";
    more.addEventListener("click", () => location.assign(more.href), {
      once: true,
    });
    document.querySelector<HTMLElement>("[data-archive-status]")!.textContent =
      "Nachladen fehlgeschlagen. Öffnen Sie die nächste Seite über den Link.";
  } finally {
    more.removeAttribute("aria-busy");
  }
});
const filters = [
  ...document.querySelectorAll<HTMLSelectElement>("[data-filter]"),
];
filters.forEach((f) =>
  f.addEventListener("change", async () => {
    const grid = document.querySelector<HTMLElement>("[data-archive-grid]")!;
    const raw = document.querySelector("#archive-items")?.textContent;
    if (!raw) return;
    const all = JSON.parse(raw) as ArticleMeta[];
    const filtered = all.filter((a) =>
      filters.every(
        (f) =>
          !f.value || a[f.dataset.filter as "pillar" | "format"] === f.value,
      ),
    );
    grid.replaceChildren();
    for (const a of filtered) {
      const card = document.createElement("article");
      card.className = "article-card";
      card.dataset.article = a.id;
      const imageLink = document.createElement("a");
      imageLink.className = "card-image";
      imageLink.href = a.route;
      imageLink.tabIndex = -1;
      imageLink.setAttribute("aria-hidden", "true");
      const img = document.createElement("img");
      img.src = `/media/${a.assetId}-480.webp`;
      img.width = 480;
      img.height = a.assetId === "budget-wege-hero" ? 720 : 320;
      img.alt = "";
      img.loading = "lazy";
      imageLink.append(img);
      const copy = document.createElement("div");
      copy.className = "card-copy";
      const label = document.createElement("p");
      label.className = "eyebrow accent";
      label.textContent = a.pillar + " · " + a.format;
      const h = document.createElement("h2");
      const link = document.createElement("a");
      link.href = a.route;
      link.textContent = a.title;
      h.append(link);
      const p = document.createElement("p");
      p.className = "card-description";
      p.textContent = a.description;
      copy.append(label, h, p);
      card.append(imageLink, copy);
      grid.append(card);
    }
    document.querySelector<HTMLElement>("[data-count]")!.textContent =
      filtered.length + " Beiträge";
    document.querySelector<HTMLElement>("[data-archive-status]")!.textContent =
      filtered.length
        ? filtered.length + " passende Beiträge."
        : "Keine Beiträge für diese Kombination.";
    const pagination = document.querySelector<HTMLElement>(".pagination");
    if (pagination) pagination.hidden = true;
  }),
);
