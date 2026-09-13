import type { ProjectFile } from "@/domain/types";
import { PROJECT_FILE_EXTENSION, deserializeProject, getProjectFileName, serializeProject } from "@/domain/project-file";

/**
 * Port for persisting projects as .engsched files.
 * `save` resolves false and `load` resolves null when the user cancels.
 * `load` throws when the chosen file is not a valid project.
 */
export interface ProjectStorage {
  save(project: ProjectFile): Promise<boolean>;
  load(): Promise<ProjectFile | null>;
}

type ElectronAPI = {
  saveProject(json: string, defaultFileName: string): Promise<boolean>;
  loadProject(): Promise<string | null>;
};

function getElectronAPI(): ElectronAPI | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { electronAPI?: ElectronAPI }).electronAPI) ?? null;
}

/**
 * Detects whether we are running inside Electron
 */
export function isElectron(): boolean {
  return getElectronAPI() !== null;
}

/**
 * Browser adapter: saves through a download and loads through a file input (web/Mac)
 */
export const webProjectStorage: ProjectStorage = {
  async save(project) {
    const json = serializeProject(project);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getProjectFileName(project.projectSettings?.title);
    link.click();
    URL.revokeObjectURL(url);
    return true;
  },

  load() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = PROJECT_FILE_EXTENSION + ",.json";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(deserializeProject(reader.result as string));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
        reader.readAsText(file);
      };
      // User cancelled the dialog
      input.oncancel = () => resolve(null);
      input.click();
    });
  },
};

/**
 * Electron adapter: native save/open dialogs through the preload bridge (Windows)
 */
export const electronProjectStorage: ProjectStorage = {
  async save(project) {
    const api = getElectronAPI();
    if (!api) return false;
    const json = serializeProject(project);
    const fileName = getProjectFileName(project.projectSettings?.title);
    return api.saveProject(json, fileName);
  },

  async load() {
    const api = getElectronAPI();
    if (!api) return null;
    const json = await api.loadProject();
    if (!json) return null;
    return deserializeProject(json);
  },
};

/**
 * Picks the adapter for the current runtime. Resolved once at composition time.
 */
export function getProjectStorage(): ProjectStorage {
  return isElectron() ? electronProjectStorage : webProjectStorage;
}
