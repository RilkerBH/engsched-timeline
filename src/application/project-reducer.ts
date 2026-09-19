import type { MilestoneData, PeriodData, ProjectFile, ProjectSettings, TaskData } from "@/domain/types";
import {
  type BulkPatch,
  type Selection,
  applyPatch,
  moveTasksBlock,
  shiftMilestoneDates,
  shiftTaskDates,
} from "@/domain/bulk";
import { type LabelOffsets, ZERO_OFFSETS, migrateMilestoneLabelOffsets, migrateTaskLabelOffsets } from "@/domain/label-layout";

/**
 * Single source of truth for a project. Every change goes through
 * `projectReducer`, which keeps the state consistent and makes features
 * such as undo/redo or autosave a matter of wrapping the reducer.
 */
export interface ProjectState {
  settings: ProjectSettings | null;
  tasks: TaskData[];
  milestones: MilestoneData[];
  periods: PeriodData[];
}

export const INITIAL_PROJECT_STATE: ProjectState = {
  settings: null,
  tasks: [],
  milestones: [],
  periods: [],
};

export type LabelKind = "name" | "date";
export type ItemKind = "task" | "milestone";

export type ProjectAction =
  | { type: "project/configured"; settings: Omit<ProjectSettings, "id">; id: string }
  | { type: "project/loaded"; file: ProjectFile }
  | { type: "project/reset" }
  | { type: "task/saved"; task: TaskData }
  | { type: "task/deleted"; id: string }
  | { type: "milestone/saved"; milestone: MilestoneData }
  | { type: "milestone/deleted"; id: string }
  | { type: "period/saved"; period: PeriodData }
  | { type: "period/deleted"; id: string }
  | { type: "label/dragged"; item: ItemKind; label: LabelKind; id: string; delta: { x: number; y: number }; intervalId?: string }
  | { type: "items/patched"; ids: Selection; patch: BulkPatch }
  | { type: "items/labelsReset"; ids: Selection }
  | { type: "items/datesShifted"; ids: Selection; days: number }
  | { type: "items/deleted"; ids: Selection }
  | { type: "tasks/moved"; ids: string[]; direction: "up" | "down" }
  | { type: "labels/migrated" };

function nextOrder(tasks: TaskData[]): number {
  return tasks.length > 0 ? Math.max(...tasks.map(p => p.order)) + 1 : 0;
}

function dragLabel<T extends LabelOffsets>(item: T, label: LabelKind, delta: { x: number; y: number }): T {
  if (label === "name") {
    return { ...item, labelOffsetX: (item.labelOffsetX || 0) + delta.x, labelOffsetY: (item.labelOffsetY || 0) + delta.y };
  }
  return { ...item, dateLabelOffsetX: (item.dateLabelOffsetX || 0) + delta.x, dateLabelOffsetY: (item.dateLabelOffsetY || 0) + delta.y };
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case "project/configured":
      return { ...state, settings: { ...action.settings, id: action.id } };

    case "project/loaded":
      return {
        settings: action.file.projectSettings,
        tasks: action.file.tasks,
        milestones: action.file.milestones,
        periods: action.file.periods ?? [],
      };

    case "project/reset":
      return INITIAL_PROJECT_STATE;

    case "task/saved": {
      const exists = state.tasks.some(p => p.id === action.task.id);
      const tasks = exists
        ? state.tasks.map(p => (p.id === action.task.id ? action.task : p))
        : [...state.tasks, { ...action.task, order: nextOrder(state.tasks) }];
      return { ...state, tasks };
    }

    case "task/deleted":
      return { ...state, tasks: state.tasks.filter(p => p.id !== action.id) };

    case "milestone/saved": {
      const exists = state.milestones.some(m => m.id === action.milestone.id);
      const milestones = exists
        ? state.milestones.map(m => (m.id === action.milestone.id ? action.milestone : m))
        : [...state.milestones, action.milestone];
      return { ...state, milestones };
    }

    case "milestone/deleted":
      return { ...state, milestones: state.milestones.filter(m => m.id !== action.id) };

    case "period/saved": {
      const exists = state.periods.some(p => p.id === action.period.id);
      const periods = exists
        ? state.periods.map(p => (p.id === action.period.id ? action.period : p))
        : [...state.periods, action.period];
      return { ...state, periods };
    }

    case "period/deleted":
      return { ...state, periods: state.periods.filter(p => p.id !== action.id) };

    case "label/dragged":
      if (action.item === "task") {
        return {
          ...state,
          tasks: state.tasks.map(p => {
            if (p.id !== action.id) return p;
            if (action.intervalId && p.intervals) {
              return { ...p, intervals: p.intervals.map(iv => (iv.id === action.intervalId ? dragLabel(iv, action.label, action.delta) : iv)) };
            }
            return dragLabel(p, action.label, action.delta);
          }),
        };
      }
      return { ...state, milestones: state.milestones.map(m => (m.id === action.id ? dragLabel(m, action.label, action.delta) : m)) };

    case "items/patched": {
      // showTextInside only exists on tasks; the other fields are shared
      const { showTextInside, height, ...shared } = action.patch;
      return {
        ...state,
        tasks: applyPatch<TaskData>(state.tasks, action.ids.tasks, action.patch),
        milestones: applyPatch<MilestoneData>(state.milestones, action.ids.milestones, shared),
      };
    }

    case "items/labelsReset": {
      const resetIds = new Set(action.ids.tasks);
      return {
        ...state,
        tasks: applyPatch(state.tasks, action.ids.tasks, { ...ZERO_OFFSETS }).map(t =>
          resetIds.has(t.id) && t.intervals
            ? { ...t, intervals: t.intervals.map(iv => ({ ...iv, ...ZERO_OFFSETS })) }
            : t
        ),
        milestones: applyPatch(state.milestones, action.ids.milestones, { ...ZERO_OFFSETS }),
      };
    }

    case "items/datesShifted": {
      if (!state.settings) return state;
      const { startDate, endDate } = state.settings;
      return {
        ...state,
        tasks: shiftTaskDates(state.tasks, action.ids.tasks, action.days, startDate, endDate).items,
        milestones: shiftMilestoneDates(state.milestones, action.ids.milestones, action.days, startDate, endDate).items,
      };
    }

    case "items/deleted": {
      const pk = new Set(action.ids.tasks);
      const ms = new Set(action.ids.milestones);
      return {
        ...state,
        tasks: state.tasks.filter(p => !pk.has(p.id)),
        milestones: state.milestones.filter(m => !ms.has(m.id)),
      };
    }

    case "tasks/moved":
      return { ...state, tasks: moveTasksBlock(state.tasks, action.ids, action.direction) };

    case "labels/migrated":
      return {
        ...state,
        tasks: state.tasks.map(migrateTaskLabelOffsets),
        milestones: state.milestones.map(migrateMilestoneLabelOffsets),
      };

    default:
      return state;
  }
}
