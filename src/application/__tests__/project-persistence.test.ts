import { describe, expect, it } from "vitest";
import { INITIAL_PROJECT_STATE } from "@/application/project-reducer";
import { PROJECT_STORAGE_KEY, type KeyValueStore, loadPersistedState, persistState } from "@/application/project-persistence";

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: k => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

const settings = { id: "p", title: "Obra", startDate: "2026-01-01", endDate: "2026-12-31" };

describe("loadPersistedState", () => {
  it("returns the initial state when nothing is stored or the store is unavailable", () => {
    expect(loadPersistedState(undefined)).toBe(INITIAL_PROJECT_STATE);
    expect(loadPersistedState(memoryStore())).toBe(INITIAL_PROJECT_STATE);
  });

  it("round-trips through persistState", () => {
    const store = memoryStore();
    const state = { settings, packages: [], milestones: [] };
    persistState(store, state);
    expect(loadPersistedState(store)).toEqual(state);
  });

  it("reads schema 1 keys and migrates legacy label offsets", () => {
    const store = memoryStore({
      "engsched-settings": JSON.stringify(settings),
      "engsched-packages": JSON.stringify([{ id: "a", name: "a", order: 0, startDate: "2026-01-01", endDate: "2026-02-01", color: "#000", height: 32, showTextInside: false, labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 }]),
      "engsched-milestones": JSON.stringify([]),
    });
    const state = loadPersistedState(store);
    expect(state.settings).toEqual(settings);
    expect(state.packages[0]).toMatchObject({ labelOffsetX: 0, dateLabelOffsetY: 0 });
  });

  it("does not re-migrate schema 1 data already at label schema 2", () => {
    const store = memoryStore({
      "engsched-packages": JSON.stringify([{ id: "a", labelOffsetX: 10, labelOffsetY: 0, dateLabelOffsetX: 10, dateLabelOffsetY: 15 }]),
      "engsched-label-schema": "2",
    });
    expect(loadPersistedState(store).packages[0].labelOffsetX).toBe(10);
  });

  it("ignores corrupt data", () => {
    const store = memoryStore({ [PROJECT_STORAGE_KEY]: "{not json" });
    expect(loadPersistedState(store)).toBe(INITIAL_PROJECT_STATE);
  });
});
