import { describe, expect, it } from "vitest";
import { getMilestonePosition, getMonthHeaders, getPositionAndWidth } from "@/domain/layout";

const P = ["2026-01-01", "2026-12-31"] as const; // 364 days between the two dates

describe("getPositionAndWidth", () => {
  it("returns percentages relative to the project range", () => {
    const r = getPositionAndWidth("2026-01-01", "2026-12-31", ...P);
    expect(r.left).toBe(0);
    expect(r.width).toBe(100);
  });

  it("positions an item inside the range", () => {
    const r = getPositionAndWidth("2026-01-01", "2026-01-01", ...P);
    expect(r).toEqual({ left: 0, width: 0 });
    const half = getPositionAndWidth("2026-07-02", "2026-12-31", ...P); // day 182 of 364
    expect(half.left).toBeCloseTo(50, 5);
    expect(half.width).toBeCloseTo(50, 5);
  });

  it("returns zero when the project range is empty or inverted", () => {
    expect(getPositionAndWidth("2026-01-01", "2026-01-02", "2026-01-01", "2026-01-01")).toEqual({ left: 0, width: 0 });
  });
});

describe("getMilestonePosition", () => {
  it("maps the project start to 0 and the end to 100", () => {
    expect(getMilestonePosition("2026-01-01", ...P)).toBe(0);
    expect(getMilestonePosition("2026-12-31", ...P)).toBe(100);
  });
});

describe("getMonthHeaders", () => {
  it("produces one header per month with pt-BR names", () => {
    const headers = getMonthHeaders("2026-01-15", "2026-03-10");
    expect(headers.map(h => h.name)).toEqual(["jan/26", "fev/26", "mar/26"]);
  });

  it("gives partial months proportional widths", () => {
    const headers = getMonthHeaders("2026-01-15", "2026-03-10"); // 54 days between
    // Jan 15..31 = 17 days, Feb = 28 days, Mar 1..10 = 10 days (end inclusive)
    expect(headers[0].width).toBeCloseTo((17 / 54) * 100, 5);
    expect(headers[1].width).toBeCloseTo((28 / 54) * 100, 5);
    expect(headers[2].width).toBeCloseTo((10 / 54) * 100, 5);
  });
});
