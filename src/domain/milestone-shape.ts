import type { MilestoneShape } from "./types";

/**
 * Geometry of the milestone markers. Pure functions, no DOM.
 *
 * Every shape is drawn in its own box (`width` x `height`, px) whose
 * bottom edge sits on top of the vertical line (stem) — or directly on the
 * timeline axis when there's no stem. `anchorX` is where the date falls
 * inside the box: the horizontal center for most shapes, the left edge
 * (the "pole") for the flag.
 */
export interface MilestoneShapeGeometry {
  width: number;
  height: number;
  anchorX: number;
  /** SVG element to draw, with its attributes. */
  element:
    | { tag: "polygon"; points: string }
    | { tag: "circle"; cx: number; cy: number; r: number }
    | { tag: "rect"; x: number; y: number; width: number; height: number; rx: number };
}

export const DEFAULT_MILESTONE_SHAPE: MilestoneShape = "triangle";

export const MILESTONE_SHAPE_LABELS: Record<MilestoneShape, string> = {
  triangle: "Triângulo",
  "triangle-down": "Triângulo invertido",
  flag: "Bandeira",
  diamond: "Losango",
  circle: "Círculo",
  square: "Quadrado",
  star: "Estrela",
};

const TRIANGLE_RATIO = 0.866; // width / height of an equilateral triangle

const pts = (points: [number, number][]) => points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
const round = (n: number) => Math.round(n * 100) / 100;

function starPoints(size: number): [number, number][] {
  const c = size / 2;
  const outer = size / 2;
  const inner = outer * 0.45;
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    return [c + r * Math.cos(angle), c + r * Math.sin(angle) + size * 0.05] as [number, number];
  });
}

export function getMilestoneShapeGeometry(shape: MilestoneShape | undefined, size: number): MilestoneShapeGeometry {
  switch (shape ?? DEFAULT_MILESTONE_SHAPE) {
    case "triangle-down": {
      const w = size * TRIANGLE_RATIO;
      return { width: w, height: size, anchorX: w / 2, element: { tag: "polygon", points: pts([[0, 0], [w, 0], [w / 2, size]]) } };
    }
    case "flag": {
      // Pennant pointing right, its left edge (the pole) on the date
      const w = size * TRIANGLE_RATIO;
      return { width: w, height: size, anchorX: 0, element: { tag: "polygon", points: pts([[0, 0], [w, size / 2], [0, size]]) } };
    }
    case "diamond":
      return { width: size, height: size, anchorX: size / 2, element: { tag: "polygon", points: pts([[size / 2, 0], [size, size / 2], [size / 2, size], [0, size / 2]]) } };
    case "circle":
      return { width: size, height: size, anchorX: size / 2, element: { tag: "circle", cx: size / 2, cy: size / 2, r: size / 2 } };
    case "square":
      return { width: size, height: size, anchorX: size / 2, element: { tag: "rect", x: 0, y: 0, width: size, height: size, rx: Math.min(3, size / 8) } };
    case "star":
      return { width: size, height: size, anchorX: size / 2, element: { tag: "polygon", points: pts(starPoints(size)) } };
    case "triangle":
    default: {
      const w = size * TRIANGLE_RATIO;
      return { width: w, height: size, anchorX: w / 2, element: { tag: "polygon", points: pts([[w / 2, 0], [0, size], [w, size]]) } };
    }
  }
}
