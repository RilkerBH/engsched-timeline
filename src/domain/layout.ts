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

export interface PackageLayout {
  left: number;   // % of the timeline width
  width: number;  // % of the timeline width
  top: number;    // px from the top of the rows container
}

/**
 * Stacks packages vertically in `order`, each one `gap` px below the previous.
 * Returns the rows and the total container height (with a bottom padding of `gap`).
 */
export function layoutPackageRows<T extends { order: number; height: number; startDate: string; endDate: string }>(
  packages: T[],
  projectStartDate: string,
  projectEndDate: string,
  gap: number
): { rows: (T & PackageLayout)[]; height: number } {
  const sorted = [...packages].sort((a, b) => a.order - b.order);
  let top = 0;
  const rows = sorted.map(pkg => {
    const row = { ...pkg, ...getPositionAndWidth(pkg.startDate, pkg.endDate, projectStartDate, projectEndDate), top };
    top += pkg.height + gap;
    return row;
  });
  const last = rows[rows.length - 1];
  return { rows, height: last ? last.top + last.height + gap : gap };
}
