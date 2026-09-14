"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MilestoneData, TaskData } from "@/domain/types";
import { EMPTY_SELECTION, type Selection, rangeSelectTasks, selectionSize, toggleId } from "@/domain/bulk";

type Modifiers = { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean };

/**
 * UI state for multi-selection on the timeline. Ids of deleted items are
 * pruned automatically. Keyboard: Esc clears, Delete/Backspace asks to delete.
 */
export function useSelection(tasks: TaskData[], milestones: MilestoneData[], onDeleteRequest: () => void) {
  const [raw, setRaw] = useState<Selection>(EMPTY_SELECTION);

  const selection = useMemo<Selection>(() => ({
    tasks: raw.tasks.filter(id => tasks.some(p => p.id === id)),
    milestones: raw.milestones.filter(id => milestones.some(m => m.id === id)),
  }), [raw, tasks, milestones]);

  const hasSelection = selectionSize(selection) > 0;

  const clear = useCallback(() => setRaw(EMPTY_SELECTION), []);

  const selectTask = useCallback((id: string, e: Modifiers) => {
    setRaw(sel => {
      if (e.shiftKey) return { ...sel, tasks: rangeSelectTasks(tasks, sel.tasks, id) };
      if (e.ctrlKey || e.metaKey) return { ...sel, tasks: toggleId(sel.tasks, id) };
      const isOnlyOne = selectionSize(sel) === 1 && sel.tasks[0] === id;
      return isOnlyOne ? EMPTY_SELECTION : { tasks: [id], milestones: [] };
    });
  }, [tasks]);

  const selectMilestone = useCallback((id: string, e: Modifiers) => {
    setRaw(sel => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return { ...sel, milestones: toggleId(sel.milestones, id) };
      const isOnlyOne = selectionSize(sel) === 1 && sel.milestones[0] === id;
      return isOnlyOne ? EMPTY_SELECTION : { tasks: [], milestones: [id] };
    });
  }, []);

  const selectAll = useCallback(() => {
    setRaw({ tasks: tasks.map(p => p.id), milestones: milestones.map(m => m.id) });
  }, [tasks, milestones]);

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

  return { selection, hasSelection, clear, selectTask, selectMilestone, selectAll };
}
