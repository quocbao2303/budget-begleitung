import { calculate, parseMoney, rules, euro } from "../lib/budget";
const form = document.querySelector<HTMLFormElement>("#budget-form");
if (form) {
  const result = document.querySelector<HTMLElement>("#budget-result")!;
  const error = document.querySelector<HTMLElement>("#budget-error")!;
  const grade = form.querySelector<HTMLSelectElement>("[name=grade]")!;
  const names = ["used", "expenses", "conversion", "entlastung", "carryover"];
  const field = (name: string) =>
    form.elements.namedItem(name) as HTMLInputElement;
  function gradeChanged() {
    const pg1 = grade.value === "1";
    field("used").disabled = pg1;
    field("conversion").disabled = pg1;
    if (pg1) {
      field("used").value = "0";
      field("conversion").value = "0";
    }
    document.querySelector<HTMLElement>("#pg1-note")!.hidden = !pg1;
  }
  grade.addEventListener("change", gradeChanged);
  function run(event?: Event) {
    event?.preventDefault();
    error.textContent = "";
    result.hidden = true;
    try {
      const values = Object.fromEntries(
        names.map((n) => {
          const v = parseMoney(field(n).value);
          if (v === null)
            throw new Error(
              n === "entlastung"
                ? "Bitte klären Sie den verfügbaren Entlastungsbetrag oder wählen Sie ausdrücklich das Beispiel."
                : "Bitte geben Sie einen Betrag ab 0 Euro ein.",
            );
          return [n, v];
        }),
      );
      const input = {
        ...values,
        grade: Number(grade.value),
        home: field("home").checked,
        recognized: field("recognized").checked,
      } as Parameters<typeof calculate>[0];
      const r = calculate(input);
      const updates: Record<string, string> = {
        total: euro(r.reimbursement),
        eCurrent: euro(r.eCurrent),
        eCarry: euro(r.eCarry),
        conversion: euro(r.C),
        remaining: euro(r.remainingCash),
        percent: new Intl.NumberFormat("de-DE", {
          style: "percent",
          maximumFractionDigits: 1,
        }).format(r.remainingPercent),
        self: euro(r.selfPay),
        reduction: euro(r.cashReduction),
        used: euro(r.used),
        expenses: euro(r.expenses),
        max: euro(r.maxConversion),
        grade: grade.value,
      };
      for (const [key, val] of Object.entries(updates))
        document
          .querySelectorAll<HTMLElement>(`[data-result="${key}"]`)
          .forEach((el) => (el.textContent = val));
      for (const [key, n] of [
        ["e", r.E],
        ["c", r.C],
        ["self", r.selfPay],
      ] as const) {
        const el = document.querySelector<HTMLElement>(
          `.allocation-diagram .${key}`,
        )!;
        el.style.width = (r.expenses ? (n / r.expenses) * 100 : 0) + "%";
      }
      result.hidden = false;
      document.querySelector<HTMLElement>("#budget-empty")!.hidden = true;
      document.querySelector<HTMLElement>("#budget-results-title")!.focus();
    } catch (e) {
      error.textContent = (e as Error).message;
      document.querySelector<HTMLElement>("#budget-empty")!.hidden = false;
      error.focus();
    }
  }
  form.addEventListener("submit", run);
  form.addEventListener("reset", () => {
    setTimeout(() => {
      result.hidden = true;
      error.textContent = "";
      document.querySelector<HTMLElement>("#budget-empty")!.hidden = false;
      gradeChanged();
    }, 0);
  });
  document.querySelector("#budget-example")?.addEventListener("click", () => {
    grade.value = "3";
    gradeChanged();
    field("home").checked = true;
    field("recognized").checked = true;
    field("used").value = "0";
    field("expenses").value = "729,80";
    field("conversion").value = "598,80";
    field("entlastung").value = "131";
    field("carryover").value = "0";
    run();
  });
  document.querySelector<HTMLElement>("#rules-date")!.textContent =
    new Intl.DateTimeFormat("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Berlin",
    }).format(new Date(rules.checkedAt + "T12:00:00Z"));
}
