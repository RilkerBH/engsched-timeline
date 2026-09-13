import { addDays, format, parseISO } from "date-fns";
import type { MilestoneData, ServicePackageData } from "./types";

/**
 * Pure functions for bulk operations on packages and milestones.
 * No React or global state dependencies.
 */

export interface Selection {
  packages: string[];
  milestones: string[];
}

export const EMPTY_SELECTION: Selection = { packages: [], milestones: [] };

export function selectionSize(sel: Selection): number {
  return sel.packages.length + sel.milestones.length;
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
}

/**
 * Range selection (Shift+click) between the last selected package and the
 * target, following the visual order of the packages.
 */
export function rangeSelectPackages(
  packages: ServicePackageData[],
  currentSelection: string[],
  targetId: string
): string[] {
  const ordered = [...packages].sort((a, b) => a.order - b.order).map(p => p.id);
  const anchorId = currentSelection[currentSelection.length - 1];
  const anchorIdx = ordered.indexOf(anchorId);
  const targetIdx = ordered.indexOf(targetId);
  if (anchorIdx === -1 || targetIdx === -1) return toggleId(currentSelection, targetId);
  const [from, to] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
  const range = ordered.slice(from, to + 1);
  return Array.from(new Set([...currentSelection, ...range]));
}

/**
 * Moves the selected packages one position up/down as a block, preserving
 * their relative order. Returns a new list with `order` renumbered 0..n-1.
 */
export function movePackagesBlock(
  packages: ServicePackageData[],
  selectedIds: string[],
  direction: "up" | "down"
): ServicePackageData[] {
  const selected = new Set(selectedIds);
  const ordered = [...packages].sort((a, b) => a.order - b.order);

  if (direction === "up") {
    for (let i = 1; i < ordered.length; i++) {
      if (selected.has(ordered[i].id) && !selected.has(ordered[i - 1].id)) {
        [ordered[i - 1], ordered[i]] = [ordered[i], ordered[i - 1]];
      }
    }
  } else {
    for (let i = ordered.length - 2; i >= 0; i--) {
      if (selected.has(ordered[i].id) && !selected.has(ordered[i + 1].id)) {
        [ordered[i], ordered[i + 1]] = [ordered[i + 1], ordered[i]];
      }
    }
  }

  return ordered.map((p, idx) => (p.order === idx ? p : { ...p, order: idx }));
}

export type BulkPatch = Partial<
  Pick<ServicePackageData, "color" | "dateFormat" | "showTextInside" | "preventNameLineBreak" | "height">
>;

export function applyPatch<T extends { id: string }>(items: T[], ids: string[], patch: Partial<T>): T[] {
  const set = new Set(ids);
  return items.map(item => (set.has(item.id) ? { ...item, ...patch } : item));
}

function shiftIso(date: string, days: number): string {
  return format(addDays(parseISO(date), days), "yyyy-MM-dd");
}

export interface ShiftResult<T> {
  items: T[];
  /** Ids that would fall outside the project range (the operation is not applied to them). */
  outOfRange: string[];
}

/**
 * Shifts the dates of the selected packages by N days (positive = forward).
 * Items that would leave the project range are left untouched and reported
 * in `outOfRange`.
 */
export function shiftPackageDates(
  packages: ServicePackageData[],
  ids: string[],
  days: number,
  projectStart: string,
  projectEnd: string
): ShiftResult<ServicePackageData> {
  const set = new Set(ids);
  const outOfRange: string[] = [];
  const items = packages.map(p => {
    if (!set.has(p.id) || days === 0) return p;
    const startDate = shiftIso(p.startDate, days);
    const endDate = shiftIso(p.endDate, days);
    if (startDate < projectStart || endDate > projectEnd) {
      outOfRange.push(p.id);
      return p;
    }
    return { ...p, startDate, endDate };
  });
  return { items, outOfRange };
}

export function shiftMilestoneDates(
  milestones: MilestoneData[],
  ids: string[],
  days: number,
  projectStart: string,
  projectEnd: string
): ShiftResult<MilestoneData> {
  const set = new Set(ids);
  const outOfRange: string[] = [];
  const items = milestones.map(m => {
    if (!set.has(m.id) || days === 0) return m;
    const date = shiftIso(m.date, days);
    if (date < projectStart || date > projectEnd) {
      outOfRange.push(m.id);
      return m;
    }
    return { ...m, date };
  });
  return { items, outOfRange };
}
