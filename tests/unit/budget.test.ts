import { describe, it, expect } from "vitest";
import {
  calculate,
  parseMoney,
  rules,
  type BudgetInput,
} from "../../src/lib/budget";
const day = "2026-10-26";
const base: BudgetInput = {
  grade: 3,
  home: true,
  recognized: true,
  used: 0,
  expenses: 72980,
  conversion: 59880,
  entlastung: 13100,
  carryover: 0,
};
const run = (patch: Partial<BudgetInput> = {}) =>
  calculate({ ...base, ...patch }, rules, day);
describe("reviewed 2026-10-26 home-care model", () => {
  it("separates reimbursements and Pflegegeld impact", () => {
    const r = run();
    expect(r).toMatchObject({
      E: 13100,
      C: 59880,
      reimbursement: 72980,
      remainingCash: 35940,
      cashReduction: 23960,
      selfPay: 0,
    });
    expect(r.remainingPercent).toBeCloseTo(0.6);
  });
  it("caps conversion by already-used Sachleistung", () =>
    expect(run({ used: 120000 }).C).toBe(29700));
  it("does not convert PG1 or divide by zero", () => {
    const r = run({ grade: 1 });
    expect(r.C).toBe(0);
    expect(r.remainingCash).toBe(0);
    expect(Number.isFinite(r.remainingPercent)).toBe(true);
  });
  it("exhausted Sachleistung gives zero conversion", () =>
    expect(run({ used: 149700 }).C).toBe(0));
  it("zero/partial choice uses only allocated conversion for Pflegegeld", () => {
    expect(run({ conversion: 0 }).remainingCash).toBe(59900);
    expect(run({ conversion: 10000 }).C).toBe(10000);
  });
  it("never reimburses same euro twice", () => {
    const r = run({ expenses: 11000 });
    expect(r.E).toBe(11000);
    expect(r.C).toBe(0);
    expect(r.remainingCash).toBe(59900);
  });
  it("tracks carryover separately", () => {
    const r = run({ entlastung: 1000, carryover: 2000, expenses: 5000 });
    expect(r.eCurrent).toBe(1000);
    expect(r.eCarry).toBe(2000);
    expect(r.C).toBe(2000);
  });
  it.each([
    { used: -1 },
    { expenses: NaN },
    { conversion: 2.2 },
    { used: 149701 },
    { grade: 0 },
    { home: false },
    { recognized: false },
  ])("rejects invalid/out-of-scope scenario %j", (patch) =>
    expect(() => run(patch)).toThrow(),
  );
  it("disables proposed, expired and overdue datasets", () => {
    expect(() =>
      calculate(base, { ...rules, status: "proposed" }, day),
    ).toThrow();
    expect(() =>
      calculate(base, { ...rules, effectiveTo: "2026-10-25" }, day),
    ).toThrow();
    expect(() => calculate(base, rules, "2026-11-27")).toThrow();
  });
  it("rejects corrupted financial rules", () => {
    expect(() =>
      calculate(
        base,
        { ...rules, sachleistung: { ...rules.sachleistung, "3": NaN } },
        day,
      ),
    ).toThrow();
  });
  it.each([
    ["0", 0],
    ["598,80", 59880],
    ["131.1", 13110],
    ["", null],
    ["-1", null],
    ["1e3", null],
    ["1.234,50", null],
    ["10,999", null],
  ])("parses %s in cents", (raw, expected) =>
    expect(parseMoney(String(raw))).toBe(expected),
  );
});
