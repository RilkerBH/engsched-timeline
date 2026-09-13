import { describe, expect, it } from "vitest";
import { STANDARD_COLORS, THEME_COLORS, contrastTextColor, isValidHex, normalizeHex } from "@/lib/colors";

describe("normalizeHex", () => {
  it("accepts 3 and 6 digit forms with or without #", () => {
    expect(normalizeHex("abc")).toBe("#AABBCC");
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("1f77b4")).toBe("#1F77B4");
    expect(normalizeHex("  #1F77B4 ")).toBe("#1F77B4");
  });

  it("rejects invalid input", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("zzz")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(isValidHex("#1234567")).toBe(false);
  });
});

describe("contrastTextColor", () => {
  it("uses black on light colors and white on dark colors", () => {
    expect(contrastTextColor("#FFFFFF")).toBe("#000000");
    expect(contrastTextColor("#FFFF00")).toBe("#000000");
    expect(contrastTextColor("#000000")).toBe("#FFFFFF");
    expect(contrastTextColor("#1F3864")).toBe("#FFFFFF");
  });
});

describe("palette", () => {
  it("has 10 theme columns with 5 shades each and 10 standard colors, all valid hex", () => {
    expect(THEME_COLORS).toHaveLength(10);
    expect(STANDARD_COLORS).toHaveLength(10);
    for (const col of THEME_COLORS) {
      expect(col.shades).toHaveLength(5);
      expect(isValidHex(col.base)).toBe(true);
      col.shades.forEach(s => expect(isValidHex(s)).toBe(true));
    }
    STANDARD_COLORS.forEach(c => expect(isValidHex(c.hex)).toBe(true));
  });
});
