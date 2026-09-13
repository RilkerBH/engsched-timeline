import { describe, expect, it } from "vitest";
import { createProjectFile, deserializeProject, getProjectFileName, migrateProjectFile, serializeProject } from "@/domain/project-file";

const settings = { id: "p", title: "Obra X", startDate: "2026-01-01", endDate: "2026-12-31" };

describe("serialize / deserialize", () => {
  it("round-trips a project at the current version", () => {
    const file = createProjectFile(settings, [], []);
    const back = deserializeProject(serializeProject(file));
    expect(back).toEqual(file);
  });

  it("rejects files without a version or with a corrupt structure", () => {
    expect(() => deserializeProject("{}")).toThrow(/versão ausente/);
    expect(() => deserializeProject(JSON.stringify({ version: "1.2", projectSettings: null, tasks: "x", milestones: [] }))).toThrow(/tarefas/);
    expect(() => deserializeProject(JSON.stringify({ version: "1.2", projectSettings: null, tasks: [], milestones: null }))).toThrow(/marcos/);
    expect(() => deserializeProject("not json")).toThrow();
  });

  it("ignores the legacy zoom field", () => {
    const back = deserializeProject(JSON.stringify({ version: "1.2", projectSettings: null, tasks: [], milestones: [], zoom: 150 }));
    expect(back).not.toHaveProperty("zoom");
  });

  it("reads tasks from the legacy servicePackages key (formats 1.0 and 1.1)", () => {
    const task = { id: "a", name: "a", order: 0, startDate: "2026-01-01", endDate: "2026-02-01", color: "#000", height: 32, showTextInside: false, labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0 };
    const back = deserializeProject(JSON.stringify({ version: "1.1", projectSettings: null, servicePackages: [task], milestones: [] }));
    expect(back.version).toBe("1.2");
    expect(back.tasks).toEqual([task]);
    expect(back).not.toHaveProperty("servicePackages");
  });
});

describe("migrateProjectFile", () => {
  it("migrates 1.0 label offsets and stamps the current version", () => {
    const legacy = deserializeProject(JSON.stringify({
      version: "1.0", exportedAt: "x", projectSettings: settings,
      servicePackages: [{ id: "a", name: "a", order: 0, startDate: "2026-01-01", endDate: "2026-02-01", color: "#000", height: 32, showTextInside: false, labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 }],
      milestones: [{ id: "m", name: "m", date: "2026-01-10", color: "#000", height: 30, labelOffsetX: 0, labelOffsetY: -10, dateLabelOffsetX: 0, dateLabelOffsetY: 15 }],
    }));
    const migrated = migrateProjectFile(legacy);
    expect(migrated.version).toBe("1.2");
    expect(migrated.tasks[0]).toMatchObject({ labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0 });
    expect(migrated.milestones[0]).toMatchObject({ labelOffsetX: 0, labelOffsetY: 0, dateLabelOffsetX: 0, dateLabelOffsetY: 0 });
  });

  it("returns files at the current version untouched", () => {
    const file = createProjectFile(settings, [], []);
    expect(migrateProjectFile(file)).toBe(file);
  });
});

describe("getProjectFileName", () => {
  it("replaces whitespace and falls back to 'projeto'", () => {
    expect(getProjectFileName("Obra  Alfa 2")).toBe("Obra_Alfa_2.engsched");
    expect(getProjectFileName(undefined)).toBe("projeto.engsched");
  });
});
