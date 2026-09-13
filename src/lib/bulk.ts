import { addDays, format, parseISO } from "date-fns";
import type { MilestoneData, ServicePackageData } from "./types";

/**
 * Funções puras para operações em bloco sobre pacotes e marcos.
 * Não dependem de React nem de estado global.
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
 * Seleção por intervalo (Shift+clique) entre o último selecionado e o alvo,
 * considerando a ordem visual dos pacotes.
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
 * Move os pacotes selecionados uma posição para cima/baixo como um bloco,
 * preservando a ordem relativa entre eles. Retorna nova lista com `order`
 * renumerado de 0..n-1.
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
  /** Ids que ficariam fora do período do projeto (a operação não é aplicada a eles). */
  outOfRange: string[];
}

/**
 * Desloca as datas dos pacotes selecionados em N dias (positivo = adiante).
 * Itens que sairiam do período do projeto são mantidos sem alteração e
 * reportados em `outOfRange`.
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
