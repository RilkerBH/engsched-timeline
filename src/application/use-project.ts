"use client"

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { FontSizes, MilestoneData, PeriodData, ProjectFile, ProjectSettings, TaskData } from "@/domain/types";
import { type BulkPatch, type Selection, copyItems, selectionSize, shiftMilestoneDates, shiftTaskDates } from "@/domain/bulk";
import { createProjectFile } from "@/domain/project-file";
import { INITIAL_PROJECT_STATE, type ItemKind, type LabelKind, projectReducer } from "./project-reducer";
import { loadPersistedState, persistState } from "./project-persistence";

function browserStore() {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

export interface ShiftDatesResult {
  moved: number;
  skipped: number;
}

/**
 * Application-level hook: owns the project state, autosaves it and exposes
 * intent-named commands. Components never touch the reducer directly.
 */
export function useProject() {
  const [state, dispatch] = useReducer(projectReducer, undefined, () => loadPersistedState(browserStore()));

  useEffect(() => {
    persistState(browserStore(), state);
  }, [state]);

  const configureProject = useCallback((settings: Omit<ProjectSettings, "id">) => {
    dispatch({ type: "project/configured", settings, id: state.settings?.id || crypto.randomUUID() });
  }, [state.settings?.id]);

  const loadProject = useCallback((file: ProjectFile) => dispatch({ type: "project/loaded", file }), []);
  const resetProject = useCallback(() => dispatch({ type: "project/reset" }), []);
  const setFontSizes = useCallback((fontSizes: FontSizes) => dispatch({ type: "project/fontSizesChanged", fontSizes }), []);

  const saveTask = useCallback((task: TaskData) => dispatch({ type: "task/saved", task }), []);
  const deleteTask = useCallback((id: string) => dispatch({ type: "task/deleted", id }), []);
  const saveMilestone = useCallback((milestone: MilestoneData) => dispatch({ type: "milestone/saved", milestone }), []);
  const deleteMilestone = useCallback((id: string) => dispatch({ type: "milestone/deleted", id }), []);
  const savePeriod = useCallback((period: PeriodData) => dispatch({ type: "period/saved", period }), []);
  const deletePeriod = useCallback((id: string) => dispatch({ type: "period/deleted", id }), []);

  const dragLabel = useCallback((item: ItemKind, label: LabelKind, id: string, delta: { x: number; y: number }, intervalId?: string) => {
    dispatch({ type: "label/dragged", item, label, id, delta, intervalId });
  }, []);

  const moveTasks = useCallback((ids: string[], direction: "up" | "down") => {
    dispatch({ type: "tasks/moved", ids, direction });
  }, []);

  const patchItems = useCallback((ids: Selection, patch: BulkPatch) => dispatch({ type: "items/patched", ids, patch }), []);
  const resetLabels = useCallback((ids: Selection) => dispatch({ type: "items/labelsReset", ids }), []);
  const deleteItems = useCallback((ids: Selection) => dispatch({ type: "items/deleted", ids }), []);
  const scaleFonts = useCallback((ids: Selection, direction: 1 | -1 | 0) => dispatch({ type: "items/fontScaled", ids, direction }), []);

  /** Duplicates the selected tasks and milestones and returns the ids of the copies. */
  const duplicateItems = useCallback((ids: Selection): Selection => {
    const copies = copyItems(state.tasks, state.milestones, ids, () => crypto.randomUUID());
    dispatch({ type: "items/duplicated", sourceTaskIds: ids.tasks, ...copies });
    return { tasks: copies.tasks.map(t => t.id), milestones: copies.milestones.map(m => m.id) };
  }, [state.tasks, state.milestones]);

  /** Shifts dates and reports how many items moved and how many were out of range. */
  const shiftDates = useCallback((ids: Selection, days: number): ShiftDatesResult => {
    if (!state.settings) return { moved: 0, skipped: 0 };
    const { startDate, endDate } = state.settings;
    const skipped =
      shiftTaskDates(state.tasks, ids.tasks, days, startDate, endDate).outOfRange.length +
      shiftMilestoneDates(state.milestones, ids.milestones, days, startDate, endDate).outOfRange.length;
    dispatch({ type: "items/datesShifted", ids, days });
    return { moved: selectionSize(ids) - skipped, skipped };
  }, [state]);

  const toProjectFile = useCallback(() => createProjectFile(state.settings, state.tasks, state.milestones, state.periods), [state]);

  const isEmpty = state === INITIAL_PROJECT_STATE;

  return useMemo(() => ({
    settings: state.settings,
    tasks: state.tasks,
    milestones: state.milestones,
    periods: state.periods,
    isEmpty,
    configureProject,
    loadProject,
    resetProject,
    setFontSizes,
    saveTask,
    deleteTask,
    saveMilestone,
    deleteMilestone,
    savePeriod,
    deletePeriod,
    dragLabel,
    moveTasks,
    patchItems,
    resetLabels,
    deleteItems,
    scaleFonts,
    duplicateItems,
    shiftDates,
    toProjectFile,
  }), [
    state, isEmpty, configureProject, loadProject, resetProject, saveTask, deleteTask,
    saveMilestone, deleteMilestone, savePeriod, deletePeriod, dragLabel, moveTasks, patchItems, resetLabels, deleteItems,
    scaleFonts, duplicateItems, shiftDates, toProjectFile, setFontSizes,
  ]);
}

export type ProjectApi = ReturnType<typeof useProject>;
