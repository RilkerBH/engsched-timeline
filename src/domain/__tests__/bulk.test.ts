import { describe, expect, it } from "vitest";
import type { MilestoneData, TaskData } from "@/domain/types";
import {
  applyPatch,
  copyItems,
  insertTaskCopies,
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

  const iv = (id: string, startDate: string, endDate: string) => ({
    id, name: id, startDate, endDate, labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0,
  });

  it("shifts every interval and recomputes the envelope, preserving name/offsets", () => {
    const withIntervals = task("a", 0, {
      startDate: "2026-03-01", endDate: "2026-05-31",
      intervals: [
        { ...iv("1", "2026-03-01", "2026-03-31"), labelOffsetX: 4 },
        iv("2", "2026-05-01", "2026-05-31"),
      ],
    });
    const { items, outOfRange } = shiftTaskDates([withIntervals], ["a"], 10, ...range);
    expect(items[0].intervals).toEqual([
      { ...iv("1", "2026-03-11", "2026-04-10"), labelOffsetX: 4 },
      iv("2", "2026-05-11", "2026-06-10"),
    ]);
    expect(items[0]).toMatchObject({ startDate: "2026-03-11", endDate: "2026-06-10" });
    expect(outOfRange).toEqual([]);
  });

  it("blocks the whole task, untouched, if any interval would leave the project range", () => {
    const withIntervals = task("a", 0, {
      startDate: "2026-03-01", endDate: "2026-12-31",
      intervals: [
        iv("1", "2026-03-01", "2026-03-31"),
        iv("2", "2026-12-01", "2026-12-31"),
      ],
    });
    const { items, outOfRange } = shiftTaskDates([withIntervals], ["a"], 10, ...range);
    expect(items[0].intervals).toEqual(withIntervals.intervals);
    expect(outOfRange).toEqual(["a"]);
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

describe("duplicating items", () => {
  const t = (id: string, order: number, extra: Partial<TaskData> = {}): TaskData => ({
    id, name: id, order, startDate: "2026-03-01", endDate: "2026-03-31", color: "#000000", height: 32,
    showTextInside: false, labelOffsetX: 5, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0, ...extra,
  });

  it("copies tasks in visual order with fresh ids, intervals included", () => {
    let n = 0;
    const tasks = [
      t("b", 1, { intervals: [
        { id: "i1", name: "x", startDate: "2026-03-01", endDate: "2026-03-05", labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0 },
        { id: "i2", name: "y", startDate: "2026-03-10", endDate: "2026-03-31", labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0 },
      ] }),
      t("a", 0),
    ];
    const copies = copyItems(tasks, [], { tasks: ["b", "a"], milestones: [] }, () => `new${n++}`);
    expect(copies.tasks.map(c => c.id)).toEqual(["new0", "new1"]);
    expect(copies.tasks[0].name).toBe("a");
    expect(copies.tasks[0].labelOffsetX).toBe(5);
    expect(copies.tasks[1].intervals?.map(iv => iv.id)).toEqual(["new2", "new3"]);
  });

  it("inserts the copies right below the last selected task", () => {
    const tasks = [t("a", 0), t("b", 1), t("c", 2)];
    const result = insertTaskCopies(tasks, ["a", "b"], [t("a2", 0), t("b2", 1)]);
    expect(result.map(x => [x.id, x.order])).toEqual([["a", 0], ["b", 1], ["a2", 2], ["b2", 3], ["c", 4]]);
  });
});
