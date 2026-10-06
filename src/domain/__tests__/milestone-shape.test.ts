import { describe, expect, it } from "vitest";
import { getMilestoneShapeGeometry } from "@/domain/milestone-shape";
import { MILESTONE_SHAPES } from "@/domain/validation";

describe("getMilestoneShapeGeometry", () => {
  it("defaults to the upward triangle used before shapes existed", () => {
    const g = getMilestoneShapeGeometry(undefined, 30);
    expect(g.element).toEqual({ tag: "polygon", points: "12.99,0 0,30 25.98,30" });
    expect(g.anchorX).toBeCloseTo(12.99, 2);
  });

  it("anchors the flag on its pole and every other shape on its center", () => {
    for (const shape of MILESTONE_SHAPES) {
      const g = getMilestoneShapeGeometry(shape, 40);
      expect(g.height).toBe(40);
      expect(g.anchorX).toBeCloseTo(shape === "flag" ? 0 : g.width / 2, 5);
    }
  });

  it("points the inverted triangle down onto the axis", () => {
    const g = getMilestoneShapeGeometry("triangle-down", 20);
    expect(g.element).toMatchObject({ tag: "polygon", points: "0,0 17.32,0 8.66,20" });
  });
});
