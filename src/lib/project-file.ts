import type { ProjectFile, ProjectSettings, ServicePackageData, MilestoneData } from "./types";
import { migrateMilestoneLabelOffsets, migratePackageLabelOffsets } from "./label-layout";

/**
 * Version of the .engsched file format.
 * 1.0 - original format (up to app v1.3.0)
 * 1.1 - label offsets become adjustments over the default position (app v1.4.0)
 */
const PROJECT_FILE_VERSION = "1.1";
const FILE_EXTENSION = ".engsched";

/**
 * Detects whether we are running inside Electron
 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && !!(window as any).electronAPI;
}

/**
 * Builds the ProjectFile object from the current state
 */
export function createProjectFile(
  projectSettings: ProjectSettings | null,
  servicePackages: ServicePackageData[],
  milestones: MilestoneData[]
): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectSettings,
    servicePackages,
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

  if (!Array.isArray(data.servicePackages)) {
    throw new Error("Arquivo de projeto inválido: pacotes de serviço ausentes.");
  }

  if (!Array.isArray(data.milestones)) {
    throw new Error("Arquivo de projeto inválido: marcos ausentes.");
  }

  return migrateProjectFile({
    version: data.version,
    exportedAt: data.exportedAt || new Date().toISOString(),
    projectSettings: data.projectSettings ?? null,
    servicePackages: data.servicePackages,
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

  let { servicePackages, milestones } = file;
  if (file.version === "1.0") {
    servicePackages = servicePackages.map(migratePackageLabelOffsets);
    milestones = milestones.map(migrateMilestoneLabelOffsets);
  }
  return { ...file, version: PROJECT_FILE_VERSION, servicePackages, milestones };
}

/**
 * Builds the file name from the project title
 */
export function getProjectFileName(title?: string): string {
  const name = title?.replace(/\s+/g, "_") || "projeto";
  return `${name}${FILE_EXTENSION}`;
}

/**
 * Saves the project through a browser download (web/Mac)
 */
export function saveProjectWeb(project: ProjectFile): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getProjectFileName(project.projectSettings?.title);
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Loads the project through a browser file input (web/Mac)
 */
export function loadProjectWeb(): Promise<ProjectFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = FILE_EXTENSION + ",.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("Nenhum arquivo selecionado."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const project = deserializeProject(reader.result as string);
          resolve(project);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
      reader.readAsText(file);
    };
    // User cancelled the dialog
    input.oncancel = () => reject(new Error("cancelled"));
    input.click();
  });
}

/**
 * Saves the project through Electron's native dialog (Windows)
 */
export async function saveProjectElectron(project: ProjectFile): Promise<boolean> {
  const api = (window as any).electronAPI;
  if (!api) return false;
  const json = serializeProject(project);
  const fileName = getProjectFileName(project.projectSettings?.title);
  const result = await api.saveProject(json, fileName);
  return result;
}

/**
 * Loads the project through Electron's native dialog (Windows)
 */
export async function loadProjectElectron(): Promise<ProjectFile | null> {
  const api = (window as any).electronAPI;
  if (!api) return null;
  const json = await api.loadProject();
  if (!json) return null;
  return deserializeProject(json);
}
