import type { ProjectFile, ProjectSettings, TaskData, TaskInterval, MilestoneData, PeriodData } from "./types";
import { migrateMilestoneLabelOffsets, migrateTaskLabelOffsets } from "./label-layout";

/**
 * Version of the .engsched file format.
 * 1.0 - original format (up to app v1.3.0)
 * 1.1 - label offsets become adjustments over the default position (app v1.4.0)
 * 1.2 - "servicePackages" renamed to "tasks" (app v2.0.0)
 * 1.3 - "periods" (highlight bands) added; absent in older files (app v2.1.0)
 * 1.4 - "intervals" (multiple date ranges per task) added; absent in older files (app v2.2.0)
 * 1.5 - each interval gained its own "name" and label offsets (independent per
 *       interval); older intervals fall back to the task's name and zero
 *       offsets (app v2.3.0)
 * 1.6 - periods gained a standalone, draggable name legend (labelOffsetX/Y)
 *       and a customizable border (borderStyle/borderColor); absent on
 *       older periods, defaulted to no drag offset and no border (app v2.4.0)
 */
export const PROJECT_FILE_VERSION = "1.6";
const LEGACY_TASKS_KEY = "servicePackages";
export const PROJECT_FILE_EXTENSION = ".engsched";

/**
 * Builds the ProjectFile object from the current state
 */
export function createProjectFile(
  projectSettings: ProjectSettings | null,
  tasks: TaskData[],
  milestones: MilestoneData[],
  periods: PeriodData[] = []
): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectSettings,
    tasks,
    milestones,
    periods,
  };
}

/**
 * Serializes the project to a JSON string
 */
export function serializeProject(project: ProjectFile): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Validates and deserializes a JSON string into a ProjectFile
 */
export function deserializeProject(json: string): ProjectFile {
  const data = JSON.parse(json);

  if (!data.version || typeof data.version !== "string") {
    throw new Error("Arquivo de projeto inválido: versão ausente.");
  }

  // Basic structure validation
  if (data.projectSettings !== null && typeof data.projectSettings !== "object") {
    throw new Error("Arquivo de projeto inválido: configurações corrompidas.");
  }

  // Formats 1.0 and 1.1 stored the tasks under "servicePackages"
  const tasks = Array.isArray(data.tasks) ? data.tasks : data[LEGACY_TASKS_KEY];
  if (!Array.isArray(tasks)) {
    throw new Error("Arquivo de projeto inválido: tarefas ausentes.");
  }

  if (!Array.isArray(data.milestones)) {
    throw new Error("Arquivo de projeto inválido: marcos ausentes.");
  }

  // Formats up to 1.2 have no periods
  if (data.periods !== undefined && !Array.isArray(data.periods)) {
    throw new Error("Arquivo de projeto inválido: períodos corrompidos.");
  }

  return migrateProjectFile({
    version: data.version,
    exportedAt: data.exportedAt || new Date().toISOString(),
    projectSettings: data.projectSettings ?? null,
    tasks,
    milestones: data.milestones,
    periods: data.periods ?? [],
    // The "zoom" field of legacy files is ignored (removed in v1.5.0)
  });
}

/** Backfills name/label offsets on intervals saved before format 1.5. */
function migrateTaskIntervals(task: TaskData): TaskData {
  if (!task.intervals) return task;
  return {
    ...task,
    intervals: task.intervals.map(iv => {
      const legacy = iv as Partial<TaskInterval>;
      return {
        id: iv.id,
        startDate: iv.startDate,
        endDate: iv.endDate,
        name: legacy.name ?? task.name,
        labelOffsetX: legacy.labelOffsetX ?? 0,
        labelOffsetY: legacy.labelOffsetY ?? 0,
        dateLabelOffsetX: legacy.dateLabelOffsetX ?? 0,
        dateLabelOffsetY: legacy.dateLabelOffsetY ?? 0,
      };
    }),
  };
}

/** Backfills the legend drag offsets and border style/color on periods saved before format 1.6. */
function migratePeriodDefaults(period: PeriodData): PeriodData {
  const legacy = period as Partial<PeriodData>;
  return {
    ...period,
    labelOffsetX: legacy.labelOffsetX ?? 0,
    labelOffsetY: legacy.labelOffsetY ?? 0,
    borderStyle: legacy.borderStyle ?? "none",
    borderColor: legacy.borderColor ?? period.color,
  };
}

/**
 * Converts a legacy file to the current format version.
 * Files already at the current version are returned unchanged.
 */
export function migrateProjectFile(file: ProjectFile): ProjectFile {
  if (file.version === PROJECT_FILE_VERSION) return file;

  let { tasks, milestones } = file;
  if (file.version === "1.0") {
    tasks = tasks.map(migrateTaskLabelOffsets);
    milestones = milestones.map(migrateMilestoneLabelOffsets);
  }
  // 1.1 -> 1.2 only renamed the key, which deserializeProject already normalizes
  // 1.2 -> 1.3 only added "periods", defaulted to [] by deserializeProject
  // 1.3 -> 1.4 only added "intervals", absent (undefined) on older tasks
  // 1.5 -> 1.6 added labelOffsetX/Y and borderStyle/borderColor on periods, absent on older ones
  tasks = tasks.map(migrateTaskIntervals);
  const periods = (file.periods ?? []).map(migratePeriodDefaults);
  return { ...file, version: PROJECT_FILE_VERSION, tasks, milestones, periods };
}

/**
 * Builds the file name from the project title
 */
export function getProjectFileName(title?: string): string {
  const name = title?.replace(/\s+/g, "_") || "projeto";
  return `${name}${PROJECT_FILE_EXTENSION}`;
}
