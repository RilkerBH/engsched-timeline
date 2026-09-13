import { describe, expect, it } from "vitest";
import { getMilestonePosition, getMonthHeaders, getPositionAndWidth, inclusiveDays } from "@/domain/layout";

const P = ["2026-01-01", "2026-12-31"] as const; // 365 days, both ends inclusive

describe("inclusiveDays", () => {
  it("counts both ends", () => {
    expect(inclusiveDays("2026-03-01", "2026-03-01")).toBe(1);
    expect(inclusiveDays(...P)).toBe(365);
  });
});

describe("getPositionAndWidth", () => {
  it("returns percentages relative to the project range", () => {
    const r = getPositionAndWidth("2026-01-01", "2026-12-31", ...P);
    expect(r.left).toBe(0);
    expect(r.width).toBe(100);
  });

  it("gives a single-day item one day of width", () => {
    const r = getPositionAndWidth("2026-01-01", "2026-01-01", ...P);
    expect(r.left).toBe(0);
    expect(r.width).toBeCloseTo((1 / 365) * 100, 5);
  });

  it("positions an item inside the range", () => {
    const r = getPositionAndWidth("2026-07-02", "2026-12-31", ...P); // starts on day index 182, lasts 183 days
    expect(r.left).toBeCloseTo((182 / 365) * 100, 5);
    expect(r.width).toBeCloseTo((183 / 365) * 100, 5);
  });

  it("makes adjacent items tile the range without gaps or overlap", () => {
    const a = getPositionAndWidth("2026-01-01", "2026-01-31", ...P);
    const b = getPositionAndWidth("2026-02-01", "2026-02-28", ...P);
    expect(a.left + a.width).toBeCloseTo(b.left, 10);
  });

  it("returns zero when the project range is inverted", () => {
    expect(getPositionAndWidth("2026-01-01", "2026-01-02", "2026-01-02", "2026-01-01")).toEqual({ left: 0, width: 0 });
  });
});

describe("getMilestonePosition", () => {
  it("maps a milestone to the start of its day", () => {
    expect(getMilestonePosition("2026-01-01", ...P)).toBe(0);
    expect(getMilestonePosition("2026-12-31", ...P)).toBeCloseTo((364 / 365) * 100, 5);
    // The milestone sits where a task starting the same day starts
    expect(getMilestonePosition("2026-06-10", ...P)).toBeCloseTo(getPositionAndWidth("2026-06-10", "2026-06-10", ...P).left, 10);
  });
});

describe("getMonthHeaders", () => {
  it("produces one header per month with pt-BR names", () => {
    const headers = getMonthHeaders("2026-01-15", "2026-03-10");
    expect(headers.map(h => h.name)).toEqual(["jan/26", "fev/26", "mar/26"]);
  });

  it("gives partial months proportional widths that add up to 100%", () => {
    const headers = getMonthHeaders("2026-01-15", "2026-03-10"); // 55 days, both ends inclusive
    // Jan 15..31 = 17 days, Feb = 28 days, Mar 1..10 = 10 days
    expect(headers[0].width).toBeCloseTo((17 / 55) * 100, 5);
    expect(headers[1].width).toBeCloseTo((28 / 55) * 100, 5);
    expect(headers[2].width).toBeCloseTo((10 / 55) * 100, 5);
    expect(headers.reduce((sum, h) => sum + h.width, 0)).toBeCloseTo(100, 10);
    expect(getMonthHeaders(...P).reduce((sum, h) => sum + h.width, 0)).toBeCloseTo(100, 10);
  });
});
