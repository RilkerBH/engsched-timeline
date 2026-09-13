import type { MilestoneData, ProjectFile, ProjectSettings, ServicePackageData } from "@/domain/types";
import {
  type BulkPatch,
  type Selection,
  applyPatch,
  movePackagesBlock,
  shiftMilestoneDates,
  shiftPackageDates,
} from "@/domain/bulk";
import { ZERO_OFFSETS, migrateMilestoneLabelOffsets, migratePackageLabelOffsets } from "@/domain/label-layout";

/**
 * Single source of truth for a project. Every change goes through
 * `projectReducer`, which keeps the state consistent and makes features
 * such as undo/redo or autosave a matter of wrapping the reducer.
 */
export interface ProjectState {
  settings: ProjectSettings | null;
  packages: ServicePackageData[];
  milestones: MilestoneData[];
}

export const INITIAL_PROJECT_STATE: ProjectState = {
  settings: null,
  packages: [],
  milestones: [],
};

export type LabelKind = "name" | "date";
export type ItemKind = "package" | "milestone";

export type ProjectAction =
  | { type: "project/configured"; settings: Omit<ProjectSettings, "id">; id: string }
  | { type: "project/loaded"; file: ProjectFile }
  | { type: "project/reset" }
  | { type: "package/saved"; pkg: ServicePackageData }
  | { type: "package/deleted"; id: string }
  | { type: "milestone/saved"; milestone: MilestoneData }
  | { type: "milestone/deleted"; id: string }
  | { type: "label/dragged"; item: ItemKind; label: LabelKind; id: string; delta: { x: number; y: number } }
  | { type: "items/patched"; ids: Selection; patch: BulkPatch }
  | { type: "items/labelsReset"; ids: Selection }
  | { type: "items/datesShifted"; ids: Selection; days: number }
  | { type: "items/deleted"; ids: Selection }
  | { type: "packages/moved"; ids: string[]; direction: "up" | "down" }
  | { type: "labels/migrated" };

function nextOrder(packages: ServicePackageData[]): number {
  return packages.length > 0 ? Math.max(...packages.map(p => p.order)) + 1 : 0;
}

function dragLabel<T extends ServicePackageData | MilestoneData>(item: T, label: LabelKind, delta: { x: number; y: number }): T {
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
        packages: action.file.servicePackages,
        milestones: action.file.milestones,
      };

    case "project/reset":
      return INITIAL_PROJECT_STATE;

    case "package/saved": {
      const exists = state.packages.some(p => p.id === action.pkg.id);
      const packages = exists
        ? state.packages.map(p => (p.id === action.pkg.id ? action.pkg : p))
        : [...state.packages, { ...action.pkg, order: nextOrder(state.packages) }];
      return { ...state, packages };
    }

    case "package/deleted":
      return { ...state, packages: state.packages.filter(p => p.id !== action.id) };

    case "milestone/saved": {
      const exists = state.milestones.some(m => m.id === action.milestone.id);
      const milestones = exists
        ? state.milestones.map(m => (m.id === action.milestone.id ? action.milestone : m))
        : [...state.milestones, action.milestone];
      return { ...state, milestones };
    }

    case "milestone/deleted":
      return { ...state, milestones: state.milestones.filter(m => m.id !== action.id) };

    case "label/dragged":
      if (action.item === "package") {
        return { ...state, packages: state.packages.map(p => (p.id === action.id ? dragLabel(p, action.label, action.delta) : p)) };
      }
      return { ...state, milestones: state.milestones.map(m => (m.id === action.id ? dragLabel(m, action.label, action.delta) : m)) };

    case "items/patched": {
      // showTextInside only exists on packages; the other fields are shared
      const { showTextInside, height, ...shared } = action.patch;
      return {
        ...state,
        packages: applyPatch<ServicePackageData>(state.packages, action.ids.packages, action.patch),
        milestones: applyPatch<MilestoneData>(state.milestones, action.ids.milestones, shared),
      };
    }

    case "items/labelsReset":
      return {
        ...state,
        packages: applyPatch(state.packages, action.ids.packages, { ...ZERO_OFFSETS }),
        milestones: applyPatch(state.milestones, action.ids.milestones, { ...ZERO_OFFSETS }),
      };

    case "items/datesShifted": {
      if (!state.settings) return state;
      const { startDate, endDate } = state.settings;
      return {
        ...state,
        packages: shiftPackageDates(state.packages, action.ids.packages, action.days, startDate, endDate).items,
        milestones: shiftMilestoneDates(state.milestones, action.ids.milestones, action.days, startDate, endDate).items,
      };
    }

    case "items/deleted": {
      const pk = new Set(action.ids.packages);
      const ms = new Set(action.ids.milestones);
      return {
        ...state,
        packages: state.packages.filter(p => !pk.has(p.id)),
        milestones: state.milestones.filter(m => !ms.has(m.id)),
      };
    }

    case "packages/moved":
      return { ...state, packages: movePackagesBlock(state.packages, action.ids, action.direction) };

    case "labels/migrated":
      return {
        ...state,
        packages: state.packages.map(migratePackageLabelOffsets),
        milestones: state.milestones.map(migrateMilestoneLabelOffsets),
      };

    default:
      return state;
  }
}
