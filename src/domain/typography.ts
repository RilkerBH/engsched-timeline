import type { FontRole, FontSizes } from "./types";

/**
 * Font sizes of the timeline texts. Pure functions, no DOM.
 *
 * Each kind of text ("role") has a project-wide size in px, stored in
 * ProjectSettings.fontSizes only when it differs from the default. Tasks and
 * milestones can additionally carry their own `fontScale` (1 = 100%), which
 * multiplies the role size of their name and date.
 */

export const FONT_ROLES: { role: FontRole; label: string; defaultSize: number }[] = [
  { role: "title", label: "Título", defaultSize: 30 },
  { role: "monthHeader", label: "Barra de meses", defaultSize: 12 },
  { role: "taskName", label: "Nome das tarefas", defaultSize: 12 },
  { role: "taskDate", label: "Datas das tarefas", defaultSize: 12 },
  { role: "milestoneName", label: "Nome dos marcos", defaultSize: 12 },
  { role: "milestoneDate", label: "Datas dos marcos", defaultSize: 12 },
  { role: "periodLegend", label: "Legenda dos períodos", defaultSize: 11 },
];

export const FONT_SIZE = { min: 6, max: 72 } as const;
export const FONT_SCALE = { min: 0.5, max: 3, step: 0.1 } as const;

const DEFAULTS = Object.fromEntries(FONT_ROLES.map(r => [r.role, r.defaultSize])) as Record<FontRole, number>;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Size (px) of every role, defaults filled in. */
export function resolveFontSizes(fontSizes?: FontSizes): Record<FontRole, number> {
  return { ...DEFAULTS, ...fontSizes };
}

/** Step of one click for a size: 1px for body texts, ~10% for larger ones (the title). */
function stepFor(size: number): number {
  return Math.max(1, Math.round(size / 10));
}

/**
 * Grows (direction 1) or shrinks (-1) the given roles by one step each,
 * within FONT_SIZE. Roles back at their default are dropped from the result.
 */
export function stepFontSizes(fontSizes: FontSizes | undefined, roles: FontRole[], direction: 1 | -1): FontSizes {
  const current = resolveFontSizes(fontSizes);
  const next: FontSizes = { ...fontSizes };
  for (const role of roles) {
    const size = current[role];
    const target = direction > 0 ? size + stepFor(size) : size - stepFor(size - 1);
    next[role] = clamp(target, FONT_SIZE.min, FONT_SIZE.max);
  }
  return pruneDefaults(next);
}

function pruneDefaults(fontSizes: FontSizes): FontSizes {
  const result: FontSizes = {};
  for (const { role, defaultSize } of FONT_ROLES) {
    const size = fontSizes[role];
    if (size !== undefined && size !== defaultSize) result[role] = size;
  }
  return result;
}

/**
 * Next per-item scale after one click (direction 1 / -1), or undefined to
 * reset (direction 0). Returns undefined when the result is 100%.
 */
export function stepFontScale(scale: number | undefined, direction: 1 | -1 | 0): number | undefined {
  if (direction === 0) return undefined;
  const next = clamp(Math.round(((scale ?? 1) + direction * FONT_SCALE.step) * 10) / 10, FONT_SCALE.min, FONT_SCALE.max);
  return next === 1 ? undefined : next;
}

/** Role size multiplied by an item's own scale, rounded to half a pixel. */
export function scaledFontSize(size: number, scale?: number): number {
  return Math.round(size * (scale ?? 1) * 2) / 2;
}

/** Line height (px) used with a font size: 16px for the default 12px text. */
export function lineHeightFor(size: number): number {
  return Math.round((size * 4) / 3);
}
