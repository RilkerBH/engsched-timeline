import type { ProjectFile, ProjectSettings, TaskData, MilestoneData } from "./types";
import { migrateMilestoneLabelOffsets, migrateTaskLabelOffsets } from "./label-layout";

/**
 * Version of the .engsched file format.
 * 1.0 - original format (up to app v1.3.0)
 * 1.1 - label offsets become adjustments over the default position (app v1.4.0)
 * 1.2 - "servicePackages" renamed to "tasks" (app v2.0.0)
 */
export const PROJECT_FILE_VERSION = "1.2";
const LEGACY_TASKS_KEY = "servicePackages";
export const PROJECT_FILE_EXTENSION = ".engsched";

/**
 * Builds the ProjectFile object from the current state
 */
export function createProjectFile(
  projectSettings: ProjectSettings | null,
  tasks: TaskData[],
  milestones: MilestoneData[]
): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectSettings,
    tasks,
    milestones,
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

  return migrateProjectFile({
    version: data.version,
    exportedAt: data.exportedAt || new Date().toISOString(),
    projectSettings: data.projectSettings ?? null,
    tasks,
    milestones: data.milestones,
    // The "zoom" field of legacy files is ignored (removed in v1.5.0)
  });
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
  return { ...file, version: PROJECT_FILE_VERSION, tasks, milestones };
}

/**
 * Builds the file name from the project title
 */
export function getProjectFileName(title?: string): string {
  const name = title?.replace(/\s+/g, "_") || "projeto";
  return `${name}${PROJECT_FILE_EXTENSION}`;
}
