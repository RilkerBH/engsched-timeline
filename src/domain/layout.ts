import {
  parseISO,
  differenceInDays,
  eachMonthOfInterval,
  endOfMonth,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Timeline geometry: converts dates into percentages of the project range.
 * Pure functions, no DOM.
 *
 * End dates are INCLUSIVE everywhere: a project from Jan 1 to Dec 31 spans
 * 365 days, a task from Mar 1 to Mar 1 spans 1 day, and the month headers add
 * up to exactly 100%. A milestone sits at the start of its day.
 */

/** Number of calendar days between two ISO dates, counting both ends. */
export function inclusiveDays(startDateStr: string, endDateStr: string): number {
  return differenceInDays(parseISO(endDateStr), parseISO(startDateStr)) + 1;
}

export function getPositionAndWidth(itemStartDateStr: string, itemEndDateStr: string, projectStartDateStr: string, projectEndDateStr: string) {
  const totalProjectDays = inclusiveDays(projectStartDateStr, projectEndDateStr);
  if (totalProjectDays <= 0) return { left: 0, width: 0 };

  const startOffsetDays = differenceInDays(parseISO(itemStartDateStr), parseISO(projectStartDateStr));
  const itemDurationDays = inclusiveDays(itemStartDateStr, itemEndDateStr);

  const left = (startOffsetDays / totalProjectDays) * 100;
  const width = (itemDurationDays / totalProjectDays) * 100;

  return { left, width };
}

export function getMilestonePosition(milestoneDateStr: string, projectStartDateStr: string, projectEndDateStr: string) {
  const totalProjectDays = inclusiveDays(projectStartDateStr, projectEndDateStr);
  if (totalProjectDays <= 0) return 0;

  const startOffsetDays = differenceInDays(parseISO(milestoneDateStr), parseISO(projectStartDateStr));

  return (startOffsetDays / totalProjectDays) * 100;
}

export function getMonthHeaders(projectStartDateStr: string, projectEndDateStr: string) {
  const projectStart = parseISO(projectStartDateStr);
  const projectEnd = parseISO(projectEndDateStr);

  const months = eachMonthOfInterval({ start: projectStart, end: projectEnd });
  const totalProjectDays = inclusiveDays(projectStartDateStr, projectEndDateStr);

  return months.map(monthStart => {
    const monthEnd = endOfMonth(monthStart);

    const effectiveStart = projectStart > monthStart ? projectStart : monthStart;
    const effectiveEnd = projectEnd < monthEnd ? projectEnd : monthEnd;

    const daysInMonth = differenceInDays(effectiveEnd, effectiveStart) + 1; // both ends inclusive

    const width = (daysInMonth / totalProjectDays) * 100;

    return {
      name: format(monthStart, "MMM/yy", { locale: ptBR }),
      width: width,
    };
  });
}

export interface TaskLayout {
  left: number;   // % of the timeline width
  width: number;  // % of the timeline width
  top: number;    // px from the top of the rows container
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

/** Name + label offsets an interval (or a single-range task) carries independently. */
export interface RangeLabels {
  name: string;
  labelOffsetX: number;
  labelOffsetY: number;
  dateLabelOffsetX: number;
  dateLabelOffsetY: number;
}

/** One of the task's date ranges, with its own name/labels. `intervalId` is undefined
 * for a single-range task (no real interval — its own top-level fields are used). */
export interface TaskRange extends DateRange, RangeLabels {
  intervalId?: string;
}

export interface TaskBar extends TaskRange {
  left: number;   // % of the TASK'S OWN bounding box (envelope), not the timeline
  width: number;  // %
}

type PartialLabels = Partial<RangeLabels>;
type IntervalTask = {
  startDate: string;
  endDate: string;
  intervals?: (DateRange & PartialLabels & { id: string })[];
} & PartialLabels;

const rangeLabelDefaults = (labels: PartialLabels): RangeLabels => ({
  name: labels.name ?? "",
  labelOffsetX: labels.labelOffsetX ?? 0,
  labelOffsetY: labels.labelOffsetY ?? 0,
  dateLabelOffsetX: labels.dateLabelOffsetX ?? 0,
  dateLabelOffsetY: labels.dateLabelOffsetY ?? 0,
});

/**
 * Returns the task's date ranges (its `intervals` when set, otherwise a
 * single range built from its own startDate/endDate/name/label offsets),
 * always sorted by startDate — the persisted `intervals` array has no
 * guaranteed order. Each range keeps its own name and label offsets.
 */
export function getTaskRanges<T extends IntervalTask>(task: T): TaskRange[] {
  const ranges: TaskRange[] = task.intervals && task.intervals.length > 1
    ? task.intervals.map(iv => ({ intervalId: iv.id, startDate: iv.startDate, endDate: iv.endDate, ...rangeLabelDefaults(iv) }))
    : [{ intervalId: undefined, startDate: task.startDate, endDate: task.endDate, ...rangeLabelDefaults(task) }];
  return [...ranges].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Positions each of the task's ranges as a bar INSIDE the task's own
 * bounding box (envelope = startDate..endDate), expressed as a % of that
 * box's own width — not of the timeline. A single-range task always gets
 * exactly one bar at {left: 0, width: 100}.
 */
export function getTaskBars<T extends IntervalTask>(task: T): TaskBar[] {
  const ranges = getTaskRanges(task);
  const envelopeDays = inclusiveDays(task.startDate, task.endDate);
  if (envelopeDays <= 0) return ranges.map(r => ({ ...r, left: 0, width: 0 }));
  return ranges.map(r => ({
    ...r,
    left: (differenceInDays(parseISO(r.startDate), parseISO(task.startDate)) / envelopeDays) * 100,
    width: (inclusiveDays(r.startDate, r.endDate) / envelopeDays) * 100,
  }));
}

/**
 * Stacks tasks vertically in `order`, each one `gap` px below the previous.
 * Returns the rows and the total container height (with a bottom padding of `gap`).
 */
export function layoutTaskRows<T extends IntervalTask & { order: number; height: number }>(
  tasks: T[],
  projectStartDate: string,
  projectEndDate: string,
  gap: number
): { rows: (T & TaskLayout & { bars: TaskBar[] })[]; height: number } {
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  let top = 0;
  const rows = sorted.map(task => {
    const row = { ...task, ...getPositionAndWidth(task.startDate, task.endDate, projectStartDate, projectEndDate), bars: getTaskBars(task), top };
    top += task.height + gap;
    return row;
  });
  const last = rows[rows.length - 1];
  return { rows, height: last ? last.top + last.height + gap : gap };
}
