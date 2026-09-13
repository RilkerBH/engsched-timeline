import { describe, expect, it } from "vitest";
import type { MilestoneData, TaskData } from "@/domain/types";
import { INITIAL_PROJECT_STATE, type ProjectState, projectReducer } from "@/application/project-reducer";

const settings = { id: "p", title: "Obra", startDate: "2026-01-01", endDate: "2026-12-31" };
const task = (id: string, order = 0, extra: Partial<TaskData> = {}): TaskData => ({
  id, name: id, order, startDate: "2026-03-01", endDate: "2026-03-31", color: "#000000", height: 32,
  showTextInside: false, labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0, ...extra,
});
const ms = (id: string, extra: Partial<MilestoneData> = {}): MilestoneData => ({
  id, name: id, date: "2026-06-01", color: "#000000", height: 30,
  labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0, ...extra,
});
const base: ProjectState = { settings, tasks: [task("a", 0), task("b", 1)], milestones: [ms("m")] };

describe("project lifecycle", () => {
  it("configures, loads and resets", () => {
    const configured = projectReducer(INITIAL_PROJECT_STATE, { type: "project/configured", settings: { title: "X", startDate: "2026-01-01", endDate: "2026-02-01" }, id: "id1" });
    expect(configured.settings).toEqual({ id: "id1", title: "X", startDate: "2026-01-01", endDate: "2026-02-01" });

    const loaded = projectReducer(configured, { type: "project/loaded", file: { version: "1.1", exportedAt: "", projectSettings: settings, tasks: [task("z")], milestones: [] } });
    expect(loaded.tasks.map(p => p.id)).toEqual(["z"]);

    expect(projectReducer(loaded, { type: "project/reset" })).toBe(INITIAL_PROJECT_STATE);
  });
});

describe("tasks and milestones", () => {
  it("assigns the next order to a new task and replaces an existing one", () => {
    const added = projectReducer(base, { type: "task/saved", task: task("c", 0) });
    expect(added.tasks.find(p => p.id === "c")?.order).toBe(2);

    const updated = projectReducer(added, { type: "task/saved", task: task("a", 0, { name: "renamed" }) });
    expect(updated.tasks.find(p => p.id === "a")?.name).toBe("renamed");
    expect(updated.tasks).toHaveLength(3);
  });

  it("deletes by id", () => {
    expect(projectReducer(base, { type: "task/deleted", id: "a" }).tasks.map(p => p.id)).toEqual(["b"]);
    expect(projectReducer(base, { type: "milestone/deleted", id: "m" }).milestones).toEqual([]);
  });

  it("upserts milestones", () => {
    const s = projectReducer(base, { type: "milestone/saved", milestone: ms("n") });
    expect(s.milestones.map(m => m.id)).toEqual(["m", "n"]);
    const s2 = projectReducer(s, { type: "milestone/saved", milestone: ms("n", { name: "N!" }) });
    expect(s2.milestones[1].name).toBe("N!");
  });

  it("moves a single task like a block of one", () => {
    const s = projectReducer(base, { type: "tasks/moved", ids: ["b"], direction: "up" });
    expect([...s.tasks].sort((x, y) => x.order - y.order).map(p => p.id)).toEqual(["b", "a"]);
  });
});

describe("labels", () => {
  it("accumulates drag deltas on the right label", () => {
    const s1 = projectReducer(base, { type: "label/dragged", item: "task", label: "name", id: "a", delta: { x: 3, y: -2 } });
    expect(s1.tasks[0]).toMatchObject({ labelOffsetX: 3, labelOffsetY: -2, dateLabelOffsetX: 0 });
    const s2 = projectReducer(s1, { type: "label/dragged", item: "milestone", label: "date", id: "m", delta: { x: 1, y: 1 } });
    expect(s2.milestones[0]).toMatchObject({ dateLabelOffsetX: 1, dateLabelOffsetY: 1, labelOffsetX: 0 });
  });

  it("resets offsets of the selected items only", () => {
    const dirty: ProjectState = { ...base, tasks: [task("a", 0, { labelOffsetX: 9 }), task("b", 1, { labelOffsetX: 9 })] };
    const s = projectReducer(dirty, { type: "items/labelsReset", ids: { tasks: ["a"], milestones: [] } });
    expect(s.tasks[0].labelOffsetX).toBe(0);
    expect(s.tasks[1].labelOffsetX).toBe(9);
  });

  it("migrates legacy label offsets", () => {
    const legacy: ProjectState = { ...base, tasks: [task("a", 0, { labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 })] };
    const s = projectReducer(legacy, { type: "labels/migrated" });
    expect(s.tasks[0]).toMatchObject({ labelOffsetX: 0, dateLabelOffsetY: 0 });
  });
});

describe("bulk actions", () => {
  const ids = { tasks: ["a"], milestones: ["m"] };

  it("patches shared fields on both kinds and task-only fields on tasks", () => {
    const s = projectReducer(base, { type: "items/patched", ids, patch: { color: "#FF0000", showTextInside: true } });
    expect(s.tasks[0]).toMatchObject({ color: "#FF0000", showTextInside: true });
    expect(s.tasks[1].color).toBe("#000000");
    expect(s.milestones[0].color).toBe("#FF0000");
    expect(s.milestones[0]).not.toHaveProperty("showTextInside");
  });

  it("shifts dates within the project range", () => {
    const s = projectReducer(base, { type: "items/datesShifted", ids, days: 7 });
    expect(s.tasks[0]).toMatchObject({ startDate: "2026-03-08", endDate: "2026-04-07" });
    expect(s.milestones[0].date).toBe("2026-06-08");
    expect(s.tasks[1].startDate).toBe("2026-03-01");
  });

  it("does nothing without settings", () => {
    const noSettings = { ...base, settings: null };
    expect(projectReducer(noSettings, { type: "items/datesShifted", ids, days: 7 })).toBe(noSettings);
  });

  it("deletes the selection", () => {
    const s = projectReducer(base, { type: "items/deleted", ids });
    expect(s.tasks.map(p => p.id)).toEqual(["b"]);
    expect(s.milestones).toEqual([]);
  });
});
