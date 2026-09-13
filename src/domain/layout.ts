import {
  parseISO,
  differenceInDays,
  eachMonthOfInterval,
  endOfMonth,
  format,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Timeline geometry: converts dates into percentages of the project range.
 * Pure functions, no DOM.
 */

export function getPositionAndWidth(itemStartDateStr: string, itemEndDateStr: string, projectStartDateStr: string, projectEndDateStr: string) {
  const projectStart = parseISO(projectStartDateStr);
  const projectEnd = parseISO(projectEndDateStr);
  const itemStart = parseISO(itemStartDateStr);
  const itemEnd = parseISO(itemEndDateStr);

  const totalProjectDays = differenceInDays(projectEnd, projectStart);
  if (totalProjectDays <= 0) return { left: 0, width: 0 };

  const startOffsetDays = differenceInDays(itemStart, projectStart);
  const itemDurationDays = differenceInDays(itemEnd, itemStart);

  const left = (startOffsetDays / totalProjectDays) * 100;
  const width = (itemDurationDays / totalProjectDays) * 100;

  return { left, width };
}

export function getMilestonePosition(milestoneDateStr: string, projectStartDateStr: string, projectEndDateStr: string) {
  const projectStart = parseISO(projectStartDateStr);
  const projectEnd = parseISO(projectEndDateStr);
  const milestoneDate = parseISO(milestoneDateStr);

  const totalProjectDays = differenceInDays(projectEnd, projectStart);
  if (totalProjectDays <= 0) return 0;

  const startOffsetDays = differenceInDays(milestoneDate, projectStart);

  return (startOffsetDays / totalProjectDays) * 100;
}

export function getMonthHeaders(projectStartDateStr: string, projectEndDateStr: string) {
  const projectStart = parseISO(projectStartDateStr);
  const projectEnd = parseISO(projectEndDateStr);

  const months = eachMonthOfInterval({ start: projectStart, end: projectEnd });
  const totalProjectDays = differenceInDays(projectEnd, projectStart);

  return months.map(monthStart => {
    const monthEnd = endOfMonth(monthStart);

    const effectiveStart = projectStart > monthStart ? projectStart : monthStart;
    let effectiveEnd = projectEnd < monthEnd ? projectEnd : monthEnd;
    effectiveEnd = addDays(effectiveEnd, 1); // differenceInDays is exclusive of the end date

    const daysInMonth = differenceInDays(effectiveEnd, effectiveStart);

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
