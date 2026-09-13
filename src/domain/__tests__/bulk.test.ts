import { describe, expect, it } from "vitest";
import type { MilestoneData, TaskData } from "@/domain/types";
import {
  applyPatch,
  moveTasksBlock,
  rangeSelectTasks,
  selectionSize,
  shiftMilestoneDates,
  shiftTaskDates,
  toggleId,
} from "@/domain/bulk";

const task = (id: string, order: number, extra: Partial<TaskData> = {}): TaskData => ({
  id, name: id, order,
  startDate: "2026-03-01", endDate: "2026-03-31",
  color: "#000000", height: 32, showTextInside: false,
  labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0,
  ...extra,
});

const ms = (id: string, date: string): MilestoneData => ({
  id, name: id, date, color: "#000000", height: 30,
  labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0,
});

const orderOf = (list: TaskData[]) => [...list].sort((a, b) => a.order - b.order).map(p => p.id);

describe("selection helpers", () => {
  it("toggleId adds and removes", () => {
    expect(toggleId([], "a")).toEqual(["a"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("selectionSize counts both kinds", () => {
    expect(selectionSize({ tasks: ["a"], milestones: ["m", "n"] })).toBe(3);
  });

  it("rangeSelectTasks selects the visual range from the last selected item", () => {
    const list = [task("a", 0), task("b", 1), task("c", 2), task("d", 3)];
    expect(rangeSelectTasks(list, ["a"], "c")).toEqual(["a", "b", "c"]);
    expect(rangeSelectTasks(list, ["d"], "b")).toEqual(["d", "b", "c"]);
  });

  it("rangeSelectTasks falls back to toggle when there is no anchor", () => {
    const list = [task("a", 0), task("b", 1)];
    expect(rangeSelectTasks(list, [], "b")).toEqual(["b"]);
  });
});

describe("moveTasksBlock", () => {
  const list = [task("a", 0), task("b", 1), task("c", 2), task("d", 3)];

  it("moves a contiguous block up keeping relative order", () => {
    expect(orderOf(moveTasksBlock(list, ["b", "c"], "up"))).toEqual(["b", "c", "a", "d"]);
  });

  it("moves a non-contiguous block down", () => {
    expect(orderOf(moveTasksBlock(list, ["a", "c"], "down"))).toEqual(["b", "a", "d", "c"]);
  });

  it("leaves items already at the edge in place", () => {
    expect(orderOf(moveTasksBlock(list, ["a", "d"], "down"))).toEqual(["b", "a", "c", "d"]);
    expect(orderOf(moveTasksBlock(list, ["a"], "up"))).toEqual(["a", "b", "c", "d"]);
  });

  it("renumbers order 0..n-1 without mutating the input", () => {
    const result = moveTasksBlock(list, ["d"], "up");
    expect(result.map(p => p.order)).toEqual([0, 1, 2, 3]);
    expect(list.map(p => p.order)).toEqual([0, 1, 2, 3]);
  });
});

describe("applyPatch", () => {
  it("applies the patch only to the given ids", () => {
    const list = [task("a", 0), task("b", 1)];
    const result = applyPatch(list, ["b"], { color: "#FF0000" });
    expect(result[0].color).toBe("#000000");
    expect(result[1].color).toBe("#FF0000");
  });
});

describe("shiftTaskDates", () => {
  const range = ["2026-01-01", "2026-12-31"] as const;

  it("shifts start and end by N days", () => {
    const { items, outOfRange } = shiftTaskDates([task("a", 0)], ["a"], 10, ...range);
    expect(items[0]).toMatchObject({ startDate: "2026-03-11", endDate: "2026-04-10" });
    expect(outOfRange).toEqual([]);
  });

  it("supports negative shifts across month boundaries", () => {
    const { items } = shiftTaskDates([task("a", 0)], ["a"], -1, ...range);
    expect(items[0].startDate).toBe("2026-02-28");
  });

  it("keeps items that would leave the project range and reports them", () => {
    const { items, outOfRange } = shiftTaskDates([task("a", 0)], ["a"], 300, ...range);
    expect(items[0].startDate).toBe("2026-03-01");
    expect(outOfRange).toEqual(["a"]);
  });

  it("ignores unselected items", () => {
    const { items } = shiftTaskDates([task("a", 0), task("b", 1)], ["a"], 5, ...range);
    expect(items[1].startDate).toBe("2026-03-01");
  });
});

describe("shiftMilestoneDates", () => {
  it("shifts within range and blocks out of range", () => {
    const list = [ms("m", "2026-06-15"), ms("n", "2026-12-30")];
    const { items, outOfRange } = shiftMilestoneDates(list, ["m", "n"], 5, "2026-01-01", "2026-12-31");
    expect(items[0].date).toBe("2026-06-20");
    expect(items[1].date).toBe("2026-12-30");
    expect(outOfRange).toEqual(["n"]);
  });
});
