import { describe, expect, it } from "vitest";
import { lineHeightFor, resolveFontSizes, scaledFontSize, stepFontScale, stepFontSizes } from "@/domain/typography";

describe("font sizes", () => {
  it("fills in the defaults", () => {
    const sizes = resolveFontSizes({ taskName: 14 });
    expect(sizes.taskName).toBe(14);
    expect(sizes.taskDate).toBe(12);
    expect(sizes.title).toBe(30);
  });

  it("steps one role by 1px and the title by ~10%", () => {
    expect(stepFontSizes(undefined, ["taskDate"], 1)).toEqual({ taskDate: 13 });
    expect(stepFontSizes(undefined, ["title"], 1)).toEqual({ title: 33 });
    expect(stepFontSizes({ title: 33 }, ["title"], -1)).toEqual({});
  });

  it("steps every role at once and drops roles back at their default", () => {
    const up = stepFontSizes(undefined, ["title", "monthHeader", "periodLegend"], 1);
    expect(up).toEqual({ title: 33, monthHeader: 13, periodLegend: 12 });
    expect(stepFontSizes(up, ["title", "monthHeader", "periodLegend"], -1)).toEqual({});
  });

  it("clamps to the allowed range", () => {
    expect(stepFontSizes({ taskName: 6 }, ["taskName"], -1)).toEqual({ taskName: 6 });
    expect(stepFontSizes({ taskName: 72 }, ["taskName"], 1)).toEqual({ taskName: 72 });
  });
});

describe("per-item font scale", () => {
  it("steps by 10%, resets and stays within range", () => {
    expect(stepFontScale(undefined, 1)).toBe(1.1);
    expect(stepFontScale(1.1, -1)).toBeUndefined();
    expect(stepFontScale(1.5, 0)).toBeUndefined();
    expect(stepFontScale(0.5, -1)).toBe(0.5);
    expect(stepFontScale(3, 1)).toBe(3);
  });

  it("scales sizes and line heights", () => {
    expect(scaledFontSize(12)).toBe(12);
    expect(scaledFontSize(12, 1.1)).toBe(13);
    expect(lineHeightFor(12)).toBe(16);
  });
});
