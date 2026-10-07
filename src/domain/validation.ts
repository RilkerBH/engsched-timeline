import * as z from "zod";
import { isValidHex } from "./colors";

/**
 * Validation rules shared by the forms. Messages are user-facing (pt-BR).
 */

export const TASK_HEIGHT = { min: 16, max: 80 } as const;
export const MILESTONE_HEIGHT = { min: 20, max: 60 } as const;
export const MILESTONE_STEM_HEIGHT = { min: 0, max: 400 } as const;
export const MILESTONE_STRIP_HEIGHT = { min: 60, max: 480, default: 80 } as const;
export const MILESTONE_SHAPES = ["triangle", "triangle-down", "flag", "diamond", "circle", "square", "star"] as const;
export const TASK_LABEL_SIDES = ["right", "left"] as const;
export const PERIOD_OPACITY = { min: 5, max: 80 } as const;
/** Px the band's top/bottom edges can be pulled in; the band never gets shorter than minHeight. */
export const PERIOD_INSET = { min: 0, max: 2000, minHeight: 24 } as const;
export const DATE_FORMATS = ["dd/MM/yyyy", "MMM/yy"] as const;
export const PERIOD_BORDER_STYLES = ["none", "solid", "dashed", "dotted"] as const;

export const MESSAGES = {
  nameRequired: "O nome é obrigatório",
  titleRequired: "O título é obrigatório",
  startRequired: "A data de início é obrigatória",
  endRequired: "A data final é obrigatória",
  endAfterStart: "A data final deve ser posterior à data de início",
  endOnOrAfterStart: "A data final deve ser igual ou posterior à data de início",
  startWithinProject: "A data de início deve estar dentro do período do projeto",
  endWithinProject: "A data final deve estar dentro do período do projeto",
  dateWithinProject: "A data deve estar dentro do período do projeto",
  invalidColor: "Cor inválida. Use o formato #RRGGBB.",
  intervalsOverlap: "Os intervalos não podem se sobrepor",
} as const;

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/** ISO dates (YYYY-MM-DD) compare correctly as strings. */
export function isWithinRange(date: string, range: DateRange): boolean {
  return date >= range.startDate && date <= range.endDate;
}

export const projectSettingsSchema = z.object({
  title: z.string().min(1, MESSAGES.titleRequired),
  startDate: z.string().min(1, MESSAGES.startRequired),
  endDate: z.string().min(1, MESSAGES.endRequired),
  milestoneStripHeight: z.number().min(MILESTONE_STRIP_HEIGHT.min).max(MILESTONE_STRIP_HEIGHT.max).optional(),
}).refine(data => data.startDate < data.endDate, {
  message: MESSAGES.endAfterStart,
  path: ["endDate"],
});

export type ProjectSettingsInput = z.infer<typeof projectSettingsSchema>;

export function taskSchema(project: DateRange) {
  return z.object({
    name: z.string().min(1, MESSAGES.nameRequired),
    startDate: z.string(),
    endDate: z.string(),
    extraIntervals: z.array(z.object({
      id: z.string(),
      name: z.string().min(1, MESSAGES.nameRequired),
      startDate: z.string(),
      endDate: z.string(),
    })).optional(),
    color: z.string().refine(isValidHex, MESSAGES.invalidColor),
    height: z.number().min(TASK_HEIGHT.min).max(TASK_HEIGHT.max),
    showTextInside: z.boolean(),
    labelSide: z.enum(TASK_LABEL_SIDES).optional(),
    preventNameLineBreak: z.boolean().optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
  }).superRefine((data, ctx) => {
    const ranges = [
      { startDate: data.startDate, endDate: data.endDate, startPath: ["startDate"] as (string | number)[], endPath: ["endDate"] as (string | number)[] },
      ...(data.extraIntervals ?? []).map((r, i) => ({
        startDate: r.startDate,
        endDate: r.endDate,
        startPath: ["extraIntervals", i, "startDate"] as (string | number)[],
        endPath: ["extraIntervals", i, "endDate"] as (string | number)[],
      })),
    ];

    for (const r of ranges) {
      if (r.startDate > r.endDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.endOnOrAfterStart, path: r.endPath });
      }
      if (!isWithinRange(r.startDate, project)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.startWithinProject, path: r.startPath });
      }
      if (!isWithinRange(r.endDate, project)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.endWithinProject, path: r.endPath });
      }
    }

    const sorted = [...ranges].sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startDate <= sorted[i - 1].endDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.intervalsOverlap, path: sorted[i].startPath });
      }
    }
  });
}

export type TaskInput = z.infer<ReturnType<typeof taskSchema>>;

export function milestoneSchema(project: DateRange) {
  return z.object({
    name: z.string().min(1, MESSAGES.nameRequired),
    date: z.string(),
    color: z.string().refine(isValidHex, MESSAGES.invalidColor),
    height: z.number().min(MILESTONE_HEIGHT.min).max(MILESTONE_HEIGHT.max),
    shape: z.enum(MILESTONE_SHAPES).optional(),
    stemHeight: z.number().min(MILESTONE_STEM_HEIGHT.min).max(MILESTONE_STEM_HEIGHT.max).optional(),
    /** Empty = same color as the milestone. */
    stemColor: z.string().refine(v => v === "" || isValidHex(v), MESSAGES.invalidColor).optional(),
    preventNameLineBreak: z.boolean().optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
  }).refine(data => isWithinRange(data.date, project), {
    message: MESSAGES.dateWithinProject,
    path: ["date"],
  });
}

export type MilestoneInput = z.infer<ReturnType<typeof milestoneSchema>>;

export function periodSchema(project: DateRange) {
  return z.object({
    name: z.string(),
    startDate: z.string().min(1, MESSAGES.startRequired),
    endDate: z.string().min(1, MESSAGES.endRequired),
    color: z.string().refine(isValidHex, MESSAGES.invalidColor),
    opacity: z.number().min(PERIOD_OPACITY.min).max(PERIOD_OPACITY.max),
    borderStyle: z.enum(PERIOD_BORDER_STYLES),
    borderColor: z.string().refine(isValidHex, MESSAGES.invalidColor),
    topInset: z.number().int().min(PERIOD_INSET.min).max(PERIOD_INSET.max).optional(),
    bottomInset: z.number().int().min(PERIOD_INSET.min).max(PERIOD_INSET.max).optional(),
  }).superRefine((data, ctx) => {
    if (data.startDate > data.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.endOnOrAfterStart, path: ["endDate"] });
    }
    if (!isWithinRange(data.startDate, project)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.startWithinProject, path: ["startDate"] });
    }
    if (!isWithinRange(data.endDate, project)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MESSAGES.endWithinProject, path: ["endDate"] });
    }
  });
}

export type PeriodInput = z.infer<ReturnType<typeof periodSchema>>;
