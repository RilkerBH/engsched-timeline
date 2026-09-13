import * as z from "zod";
import { isValidHex } from "./colors";

/**
 * Validation rules shared by the forms. Messages are user-facing (pt-BR).
 */

export const TASK_HEIGHT = { min: 16, max: 80 } as const;
export const MILESTONE_HEIGHT = { min: 20, max: 60 } as const;
export const DATE_FORMATS = ["dd/MM/yyyy", "MMM/yy"] as const;

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
    color: z.string().refine(isValidHex, MESSAGES.invalidColor),
    height: z.number().min(TASK_HEIGHT.min).max(TASK_HEIGHT.max),
    showTextInside: z.boolean(),
    preventNameLineBreak: z.boolean().optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
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

export type TaskInput = z.infer<ReturnType<typeof taskSchema>>;

export function milestoneSchema(project: DateRange) {
  return z.object({
    name: z.string().min(1, MESSAGES.nameRequired),
    date: z.string(),
    color: z.string().refine(isValidHex, MESSAGES.invalidColor),
    height: z.number().min(MILESTONE_HEIGHT.min).max(MILESTONE_HEIGHT.max),
    preventNameLineBreak: z.boolean().optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
  }).refine(data => isWithinRange(data.date, project), {
    message: MESSAGES.dateWithinProject,
    path: ["date"],
  });
}

export type MilestoneInput = z.infer<ReturnType<typeof milestoneSchema>>;
