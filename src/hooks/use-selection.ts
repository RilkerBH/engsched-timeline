"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MilestoneData, ServicePackageData } from "@/domain/types";
import { EMPTY_SELECTION, type Selection, rangeSelectPackages, selectionSize, toggleId } from "@/domain/bulk";

type Modifiers = { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean };

/**
 * UI state for multi-selection on the timeline. Ids of deleted items are
 * pruned automatically. Keyboard: Esc clears, Delete/Backspace asks to delete.
 */
export function useSelection(packages: ServicePackageData[], milestones: MilestoneData[], onDeleteRequest: () => void) {
  const [raw, setRaw] = useState<Selection>(EMPTY_SELECTION);

  const selection = useMemo<Selection>(() => ({
    packages: raw.packages.filter(id => packages.some(p => p.id === id)),
    milestones: raw.milestones.filter(id => milestones.some(m => m.id === id)),
  }), [raw, packages, milestones]);

  const hasSelection = selectionSize(selection) > 0;

  const clear = useCallback(() => setRaw(EMPTY_SELECTION), []);

  const selectPackage = useCallback((id: string, e: Modifiers) => {
    setRaw(sel => {
      if (e.shiftKey) return { ...sel, packages: rangeSelectPackages(packages, sel.packages, id) };
      if (e.ctrlKey || e.metaKey) return { ...sel, packages: toggleId(sel.packages, id) };
      const isOnlyOne = selectionSize(sel) === 1 && sel.packages[0] === id;
      return isOnlyOne ? EMPTY_SELECTION : { packages: [id], milestones: [] };
    });
  }, [packages]);

  const selectMilestone = useCallback((id: string, e: Modifiers) => {
    setRaw(sel => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return { ...sel, milestones: toggleId(sel.milestones, id) };
      const isOnlyOne = selectionSize(sel) === 1 && sel.milestones[0] === id;
      return isOnlyOne ? EMPTY_SELECTION : { packages: [], milestones: [id] };
    });
  }, []);

  const selectAll = useCallback(() => {
    setRaw({ packages: packages.map(p => p.id), milestones: milestones.map(m => m.id) });
  }, [packages, milestones]);

  useEffect(() => {
    if (!hasSelection) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "Escape") {
        clear();
      } else if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        e.preventDefault();
        onDeleteRequest();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasSelection, clear, onDeleteRequest]);

  return { selection, hasSelection, clear, selectPackage, selectMilestone, selectAll };
}
