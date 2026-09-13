import { LABEL_SCHEMA_VERSION } from "@/domain/label-layout";
import { INITIAL_PROJECT_STATE, type ProjectState, projectReducer } from "./project-reducer";

/**
 * Autosave of the project state in the browser's localStorage.
 *
 * Storage schema 2 keeps the whole state under one key. Schema 1 (up to app
 * v1.6.0) used three separate keys plus a label-schema marker; it is read
 * once and converted on first load.
 */
export const PROJECT_STORAGE_KEY = "engsched-project";
export const PROJECT_STORAGE_SCHEMA = 2;

const LEGACY_KEYS = {
  settings: "engsched-settings",
  packages: "engsched-packages",
  milestones: "engsched-milestones",
  labelSchema: "engsched-label-schema",
} as const;

interface PersistedProject {
  schema: number;
  state: ProjectState;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Reads the state from schema 1 keys, migrating label offsets when needed. */
function loadLegacyState(store: KeyValueStore): ProjectState | null {
  const settings = parse(store.getItem(LEGACY_KEYS.settings), null);
  const packages = parse(store.getItem(LEGACY_KEYS.packages), null);
  const milestones = parse(store.getItem(LEGACY_KEYS.milestones), null);
  if (settings === null && packages === null && milestones === null) return null;

  const state: ProjectState = {
    settings: settings ?? null,
    packages: Array.isArray(packages) ? packages : [],
    milestones: Array.isArray(milestones) ? milestones : [],
  };
  const labelSchema = Number(store.getItem(LEGACY_KEYS.labelSchema) || "1");
  return labelSchema >= LABEL_SCHEMA_VERSION ? state : projectReducer(state, { type: "labels/migrated" });
}

export function loadPersistedState(store: KeyValueStore | undefined): ProjectState {
  if (!store) return INITIAL_PROJECT_STATE;
  try {
    const current = parse<PersistedProject | null>(store.getItem(PROJECT_STORAGE_KEY), null);
    if (current && current.schema === PROJECT_STORAGE_SCHEMA && current.state) {
      return { ...INITIAL_PROJECT_STATE, ...current.state };
    }
    return loadLegacyState(store) ?? INITIAL_PROJECT_STATE;
  } catch (error) {
    console.error(error);
    return INITIAL_PROJECT_STATE;
  }
}

export function persistState(store: KeyValueStore | undefined, state: ProjectState): void {
  if (!store) return;
  try {
    const payload: PersistedProject = { schema: PROJECT_STORAGE_SCHEMA, state };
    store.setItem(PROJECT_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error(error);
  }
}
