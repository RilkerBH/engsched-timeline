import { describe, expect, it } from "vitest";
import type { MilestoneData, TaskData } from "@/domain/types";
import {
  LABEL_LAYOUT,
  ZERO_OFFSETS,
  migrateMilestoneLabelOffsets,
  migrateTaskLabelOffsets,
  resetLabelOffsets,
} from "@/domain/label-layout";

const baseTask: TaskData = {
  id: "a", name: "a", order: 0, startDate: "2026-01-01", endDate: "2026-02-01",
  color: "#000", height: 32, showTextInside: false,
  labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0,
};
const baseMs: MilestoneData = {
  id: "m", name: "m", date: "2026-01-10", color: "#000", height: 30,
  labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0,
};

describe("resetLabelOffsets", () => {
  it("zeroes every offset", () => {
    expect(resetLabelOffsets({ ...baseTask, labelOffsetX: 9, dateLabelOffsetY: -4 })).toMatchObject(ZERO_OFFSETS);
  });
});

describe("migrateTaskLabelOffsets (schema 1 -> 2)", () => {
  it("maps the legacy defaults to zero", () => {
    const legacy = { ...baseTask, labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 };
    expect(migrateTaskLabelOffsets(legacy)).toMatchObject(ZERO_OFFSETS);
  });

  it("treats missing offsets as the legacy defaults", () => {
    const { labelOffsetX, labelOffsetY, dateLabelOffsetX, dateLabelOffsetY, ...noOffsets } = baseTask;
    expect(migrateTaskLabelOffsets(noOffsets as TaskData)).toMatchObject(ZERO_OFFSETS);
  });

  it("preserves the on-screen position of custom offsets in outside mode", () => {
    const { gapX, nameAboveCenter, dateBelowCenter } = LABEL_LAYOUT.task.outside;
    const custom = { ...baseTask, labelOffsetX: 20, labelOffsetY: -5, dateLabelOffsetX: 12, dateLabelOffsetY: 20 };
    const m = migrateTaskLabelOffsets(custom);
    // legacy name x = barEnd + 20 + 8 ; new = barEnd + gapX + offX
    expect(gapX + m.labelOffsetX).toBe(28);
    // legacy name baseline = center - 8 - 5 ; new = center - nameAboveCenter + offY
    expect(-nameAboveCenter + m.labelOffsetY).toBe(-13);
    // legacy date x = barEnd + 12 ; new = barEnd + gapX + offX
    expect(gapX + m.dateLabelOffsetX).toBe(12);
    // legacy date top = center + 20 ; new = center + dateBelowCenter + offY
    expect(dateBelowCenter + m.dateLabelOffsetY).toBe(20);
  });

  it("preserves the on-screen position of custom offsets in inside mode", () => {
    const { dateBelowBar } = LABEL_LAYOUT.task.inside;
    const custom = { ...baseTask, showTextInside: true, labelOffsetX: 3, labelOffsetY: 2, dateLabelOffsetX: 0, dateLabelOffsetY: 6 };
    const m = migrateTaskLabelOffsets(custom);
    expect(m.labelOffsetX).toBe(3);
    expect(m.labelOffsetY).toBe(2);
    // legacy date top = barBottom + 4 + 6 ; new = barBottom + dateBelowBar + offY
    expect(dateBelowBar + m.dateLabelOffsetY).toBe(10);
  });
});

describe("migrateMilestoneLabelOffsets (schema 1 -> 2)", () => {
  it("maps the legacy defaults to zero", () => {
    const legacy = { ...baseMs, labelOffsetX: 0, labelOffsetY: -10, dateLabelOffsetX: 0, dateLabelOffsetY: 15 };
    expect(migrateMilestoneLabelOffsets(legacy)).toMatchObject(ZERO_OFFSETS);
  });

  it("preserves the on-screen position of custom offsets", () => {
    const { nameAboveMarker, dateAboveMarker } = LABEL_LAYOUT.milestone;
    const custom = { ...baseMs, labelOffsetX: 5, labelOffsetY: -30, dateLabelOffsetX: 0, dateLabelOffsetY: -14 };
    const m = migrateMilestoneLabelOffsets(custom);
    // legacy bottom distance = 4 - offY ; new = base - offY
    expect(nameAboveMarker - m.labelOffsetY).toBe(34);
    expect(dateAboveMarker - m.dateLabelOffsetY).toBe(18);
    expect(m.labelOffsetX).toBe(5);
  });
});
