import type { MilestoneData, TaskData } from "./types";

/**
 * Default layout for the name and date labels of tasks and milestones.
 *
 * The base position of every label is defined here and in the rendering
 * components. The `labelOffset*` / `dateLabelOffset*` fields on items are
 * only the MANUAL ADJUSTMENT made by the user when dragging; they default
 * to 0, so a new item is born aligned without any correction.
 *
 * All measurements in px. Label text: 12px with a 16px line height.
 */
export const LABEL_LAYOUT = {
  task: {
    /** "Name outside" mode: name and date to the right of the bar, stacked around its vertical center. */
    outside: {
      /** Horizontal distance between the end of the bar and the start of the text. */
      gapX: 8,
      /** Distance between the bar's vertical center and the baseline of the name (above). */
      nameAboveCenter: 1,
      /** Distance between the bar's vertical center and the top of the date (below). */
      dateBelowCenter: 1,
    },
    /** "Name inside" mode: name centered in the bar, date centered right below it. */
    inside: {
      /** Distance between the bottom of the bar and the top of the date. */
      dateBelowBar: 2,
    },
  },
  milestone: {
    /** Distance between the top of the triangle and the bottom of the date. */
    dateAboveMarker: 2,
    /** Distance between the top of the triangle and the bottom of the name (sits above the date). */
    nameAboveMarker: 20,
  },
  period: {
    /** Default legend position: inset from the band's own bottom-left corner, so it always starts inside the visible band regardless of content height. */
    insetX: 6,
    insetY: 6,
    /** Border width (px) used by both the band and its legend when borderStyle isn't "none". */
    borderWidth: 2,
  },
} as const;

export interface LabelOffsets {
  labelOffsetX: number;
  labelOffsetY: number;
  dateLabelOffsetX: number;
  dateLabelOffsetY: number;
}

export const ZERO_OFFSETS: LabelOffsets = {
  labelOffsetX: 0,
  labelOffsetY: 0,
  dateLabelOffsetX: 0,
  dateLabelOffsetY: 0,
};

export function resetLabelOffsets<T extends LabelOffsets>(item: T): T {
  return { ...item, ...ZERO_OFFSETS };
}

// ---------------------------------------------------------------------------
// Migration from label schema 1 (up to app v1.3.0) to schema 2.
//
// In schema 1 the default offsets were not zero and the base positions were
// different. Items still exactly at the legacy defaults move to the new
// defaults (0). Manually adjusted items get their offsets converted so that
// their on-screen position stays IDENTICAL to what it was before.
// ---------------------------------------------------------------------------

export const LABEL_SCHEMA_VERSION = 2;

const LEGACY_TASK_DEFAULTS: LabelOffsets = { labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 };
const LEGACY_MILESTONE_DEFAULTS: LabelOffsets = { labelOffsetX: 0, labelOffsetY: -10, dateLabelOffsetX: 0, dateLabelOffsetY: 15 };

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function readOffsets(item: Partial<LabelOffsets>, legacy: LabelOffsets): LabelOffsets {
  return {
    labelOffsetX: num(item.labelOffsetX, legacy.labelOffsetX),
    labelOffsetY: num(item.labelOffsetY, legacy.labelOffsetY),
    dateLabelOffsetX: num(item.dateLabelOffsetX, legacy.dateLabelOffsetX),
    dateLabelOffsetY: num(item.dateLabelOffsetY, legacy.dateLabelOffsetY),
  };
}

function sameOffsets(a: LabelOffsets, b: LabelOffsets): boolean {
  return a.labelOffsetX === b.labelOffsetX && a.labelOffsetY === b.labelOffsetY
    && a.dateLabelOffsetX === b.dateLabelOffsetX && a.dateLabelOffsetY === b.dateLabelOffsetY;
}

/**
 * Converts a task's label offsets from schema 1 to schema 2.
 *
 * Legacy positions (schema 1), "outside" mode:
 *   name:  x = barEnd + offX + 8 (padding)   text baseline = center - 8 + offY
 *   date:  x = barEnd + offX                 text top      = center + offY
 * New positions (schema 2), "outside" mode:
 *   name:  x = barEnd + gapX + offX          text baseline = center - nameAboveCenter + offY
 *   date:  x = barEnd + gapX + offX          text top      = center + dateBelowCenter + offY
 * "Inside" mode: name unchanged; legacy date sat at bottom+4+offY, new one at bottom+dateBelowBar+offY.
 */
export function migrateTaskLabelOffsets(task: TaskData): TaskData {
  const old = readOffsets(task, LEGACY_TASK_DEFAULTS);
  if (sameOffsets(old, LEGACY_TASK_DEFAULTS)) return { ...task, ...ZERO_OFFSETS };

  const { outside, inside } = LABEL_LAYOUT.task;
  if (task.showTextInside) {
    return {
      ...task,
      labelOffsetX: old.labelOffsetX,
      labelOffsetY: old.labelOffsetY,
      dateLabelOffsetX: old.dateLabelOffsetX,
      dateLabelOffsetY: old.dateLabelOffsetY + 4 - inside.dateBelowBar,
    };
  }
  return {
    ...task,
    labelOffsetX: old.labelOffsetX + 8 - outside.gapX,
    labelOffsetY: old.labelOffsetY - 8 + outside.nameAboveCenter,
    dateLabelOffsetX: old.dateLabelOffsetX - outside.gapX,
    dateLabelOffsetY: old.dateLabelOffsetY - outside.dateBelowCenter,
  };
}

/**
 * Converts a milestone's label offsets from schema 1 to schema 2.
 *
 * Legacy: name and date based on `bottom: 4px` and `translateY(offY)` (positive = down),
 *         i.e. text bottom = triangleTop + 4 - offY.
 * New:    name at `bottom: nameAboveMarker`, date at `bottom: dateAboveMarker`.
 */
export function migrateMilestoneLabelOffsets(m: MilestoneData): MilestoneData {
  const old = readOffsets(m, LEGACY_MILESTONE_DEFAULTS);
  if (sameOffsets(old, LEGACY_MILESTONE_DEFAULTS)) return { ...m, ...ZERO_OFFSETS };

  const { nameAboveMarker, dateAboveMarker } = LABEL_LAYOUT.milestone;
  return {
    ...m,
    labelOffsetX: old.labelOffsetX,
    labelOffsetY: old.labelOffsetY + (nameAboveMarker - 4),
    dateLabelOffsetX: old.dateLabelOffsetX,
    dateLabelOffsetY: old.dateLabelOffsetY + (dateAboveMarker - 4),
  };
}
