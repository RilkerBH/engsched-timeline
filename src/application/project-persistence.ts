import { LABEL_SCHEMA_VERSION } from "@/domain/label-layout";
import { INITIAL_PROJECT_STATE, type ProjectState, projectReducer } from "./project-reducer";

/**
 * Autosave of the project state in the browser's localStorage.
 *
 * Storage schema 3 keeps the whole state under one key with a "tasks" field
 * ("periods" was added in app v2.1.0 and defaults to [] when absent).
 * Schema 2 (app v1.6.1 to v1.7.0) used the same key with a "packages" field.
 * Schema 1 (up to app v1.6.0) used three separate keys plus a label-schema
 * marker. Older schemas are read once and converted on first load.
 */
export const PROJECT_STORAGE_KEY = "engsched-project";
export const PROJECT_STORAGE_SCHEMA = 3;

const LEGACY_KEYS = {
  settings: "engsched-settings",
  tasks: "engsched-packages",
  milestones: "engsched-milestones",
  labelSchema: "engsched-label-schema",
} as const;

interface PersistedProject {
  schema: number;
  state: ProjectState;
}

/** Schema 2 payload: identical to schema 3 except the tasks field was named "packages". */
interface PersistedProjectV2 {
  schema: 2;
  state: { settings: ProjectState["settings"]; packages: ProjectState["tasks"]; milestones: ProjectState["milestones"] };
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
  const tasks = parse(store.getItem(LEGACY_KEYS.tasks), null);
  const milestones = parse(store.getItem(LEGACY_KEYS.milestones), null);
  if (settings === null && tasks === null && milestones === null) return null;

  const state: ProjectState = {
    settings: settings ?? null,
    tasks: Array.isArray(tasks) ? tasks : [],
    milestones: Array.isArray(milestones) ? milestones : [],
    periods: [],
  };
  const labelSchema = Number(store.getItem(LEGACY_KEYS.labelSchema) || "1");
  return labelSchema >= LABEL_SCHEMA_VERSION ? state : projectReducer(state, { type: "labels/migrated" });
}

export function loadPersistedState(store: KeyValueStore | undefined): ProjectState {
  if (!store) return INITIAL_PROJECT_STATE;
  try {
    const current = parse<PersistedProject | PersistedProjectV2 | null>(store.getItem(PROJECT_STORAGE_KEY), null);
    if (current && current.schema === PROJECT_STORAGE_SCHEMA && current.state) {
      return { ...INITIAL_PROJECT_STATE, ...(current as PersistedProject).state };
    }
    if (current && current.schema === 2 && current.state) {
      const { packages, ...rest } = (current as PersistedProjectV2).state;
      return { ...INITIAL_PROJECT_STATE, ...rest, tasks: Array.isArray(packages) ? packages : [] };
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
