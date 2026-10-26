import rules from "../data/benefit-rules.json";
export { rules };
export type BudgetInput = {
  grade: number;
  home: boolean;
  recognized: boolean;
  used: number;
  expenses: number;
  conversion: number;
  entlastung: number;
  carryover: number;
};
export function parseMoney(value: string): number | null {
  const s = value.trim();
  if (!/^(?:0|[1-9]\d*)(?:[.,]\d{1,2})?$/.test(s)) return null;
  const [whole, decimal = ""] = s.replace(",", ".").split(".");
  const n = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(n) ? n : null;
}
export function calculate(
  input: BudgetInput,
  dataset: Omit<typeof rules, "effectiveTo"> & {
    effectiveTo: string | null;
  } = rules,
  today = new Date().toISOString().slice(0, 10),
) {
  if (
    dataset.status !== "current-law" ||
    today < dataset.effectiveFrom ||
    (dataset.effectiveTo && today > dataset.effectiveTo) ||
    today > dataset.reviewDue
  )
    throw new Error(
      "Die Regeln müssen vor einer neuen Berechnung geprüft werden. Die Erläuterungen bleiben verfügbar.",
    );
  if (
    !input.home ||
    !input.recognized ||
    ![1, 2, 3, 4, 5].includes(input.grade)
  )
    throw new Error(
      "Für diese Situation reicht das vereinfachte Modell nicht aus. Bitte klären Sie die Berechnung individuell.",
    );
  const values = [
    input.used,
    input.expenses,
    input.conversion,
    input.entlastung,
    input.carryover,
  ];
  if (values.some((n) => !Number.isSafeInteger(n) || n < 0 || n > 100000000))
    throw new Error("Bitte geben Sie einen gültigen Betrag ab 0 Euro ein.");
  const grade = String(input.grade) as keyof typeof dataset.sachleistung;
  const S = dataset.sachleistung[grade];
  const G = dataset.pflegegeld[grade];
  if (
    ![S, G, dataset.monthlyEntlastungsbetrag].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    !Number.isFinite(dataset.conversionMaxPercent) ||
    dataset.conversionMaxPercent < 0 ||
    dataset.conversionMaxPercent > 100
  )
    throw new Error(
      "Der Datensatz ist ungültig. Die Regeln müssen erneut geprüft werden.",
    );
  if (input.used > S)
    throw new Error(
      "Dieser Betrag liegt über dem für den gewählten Pflegegrad berücksichtigten Sachleistungsrahmen.",
    );
  const maxConversion =
    input.grade < dataset.conversionMinPflegegrad
      ? 0
      : Math.min(
          Math.floor((S * dataset.conversionMaxPercent) / 100),
          Math.max(0, S - input.used),
        );
  const eCurrent = Math.min(input.expenses, input.entlastung);
  const eCarry = Math.min(
    Math.max(0, input.expenses - eCurrent),
    input.carryover,
  );
  const E = eCurrent + eCarry;
  const C = Math.min(
    input.conversion,
    maxConversion,
    Math.max(0, input.expenses - E),
  );
  const remainingPercent = S > 0 ? Math.max(0, (S - input.used - C) / S) : 0;
  const remainingCash = S > 0 ? Math.round((G * (S - input.used - C)) / S) : 0;
  const cashBefore = S > 0 ? Math.round((G * (S - input.used)) / S) : 0;
  return {
    S,
    G,
    maxConversion,
    E,
    eCurrent,
    eCarry,
    C,
    reimbursement: E + C,
    selfPay: input.expenses - E - C,
    remainingCash,
    remainingPercent,
    cashReduction: cashBefore - remainingCash,
    used: input.used,
    expenses: input.expenses,
  };
}
export const euro = (c: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    c / 100,
  );
