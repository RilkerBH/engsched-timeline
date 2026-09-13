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
