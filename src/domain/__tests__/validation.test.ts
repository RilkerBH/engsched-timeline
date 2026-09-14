import { describe, expect, it } from "vitest";
import { MESSAGES, PERIOD_OPACITY, isWithinRange, milestoneSchema, periodSchema, projectSettingsSchema, taskSchema } from "@/domain/validation";

const project = { startDate: "2026-01-01", endDate: "2026-12-31" };
const firstMessage = (r: { success: boolean; error?: { issues: { message: string; path: (string | number)[] }[] } }) =>
  r.success ? null : [r.error!.issues[0].path[0], r.error!.issues[0].message];

describe("isWithinRange", () => {
  it("is inclusive on both ends", () => {
    expect(isWithinRange("2026-01-01", project)).toBe(true);
    expect(isWithinRange("2026-12-31", project)).toBe(true);
    expect(isWithinRange("2025-12-31", project)).toBe(false);
  });
});

describe("projectSettingsSchema", () => {
  it("requires the end date to be after the start date", () => {
    expect(firstMessage(projectSettingsSchema.safeParse({ title: "x", startDate: "2026-01-01", endDate: "2026-01-01" }))).toEqual(["endDate", MESSAGES.endAfterStart]);
    expect(projectSettingsSchema.safeParse({ title: "x", startDate: "2026-01-01", endDate: "2026-01-02" }).success).toBe(true);
  });

  it("requires a title", () => {
    expect(firstMessage(projectSettingsSchema.safeParse({ title: "", startDate: "2026-01-01", endDate: "2026-01-02" }))).toEqual(["title", MESSAGES.titleRequired]);
  });
});

describe("taskSchema", () => {
  const valid = { name: "a", startDate: "2026-02-01", endDate: "2026-02-01", color: "#4472C4", height: 32, showTextInside: false };
  const schema = taskSchema(project);

  it("accepts a single-day task inside the project", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("flags each date problem on its own field", () => {
    expect(firstMessage(schema.safeParse({ ...valid, endDate: "2026-01-31" }))).toEqual(["endDate", MESSAGES.endOnOrAfterStart]);
    expect(firstMessage(schema.safeParse({ ...valid, startDate: "2025-12-01", endDate: "2026-02-01" }))).toEqual(["startDate", MESSAGES.startWithinProject]);
    expect(firstMessage(schema.safeParse({ ...valid, endDate: "2027-01-01" }))).toEqual(["endDate", MESSAGES.endWithinProject]);
  });

  it("validates color and height", () => {
    expect(firstMessage(schema.safeParse({ ...valid, color: "blue" }))).toEqual(["color", MESSAGES.invalidColor]);
    expect(schema.safeParse({ ...valid, height: 100 }).success).toBe(false);
  });
});

describe("milestoneSchema", () => {
  it("requires the date to be inside the project", () => {
    const schema = milestoneSchema(project);
    expect(schema.safeParse({ name: "m", date: "2026-06-01", color: "#000000", height: 30 }).success).toBe(true);
    expect(firstMessage(schema.safeParse({ name: "m", date: "2027-06-01", color: "#000000", height: 30 }))).toEqual(["date", MESSAGES.dateWithinProject]);
  });
});

describe("periodSchema", () => {
  const valid = { name: "", startDate: "2026-02-01", endDate: "2026-03-31", color: "#5B9BD5", opacity: 25 };
  const schema = periodSchema(project);

  it("accepts an empty name", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("requires end on or after start and both inside the project", () => {
    expect(firstMessage(schema.safeParse({ ...valid, endDate: "2026-01-31" }))).toEqual(["endDate", MESSAGES.endOnOrAfterStart]);
    expect(firstMessage(schema.safeParse({ ...valid, startDate: "2025-12-31" }))).toEqual(["startDate", MESSAGES.startWithinProject]);
    expect(firstMessage(schema.safeParse({ ...valid, endDate: "2027-01-01" }))).toEqual(["endDate", MESSAGES.endWithinProject]);
  });

  it("bounds the opacity and validates the color", () => {
    expect(schema.safeParse({ ...valid, opacity: PERIOD_OPACITY.min - 1 }).success).toBe(false);
    expect(schema.safeParse({ ...valid, opacity: PERIOD_OPACITY.max + 1 }).success).toBe(false);
    expect(firstMessage(schema.safeParse({ ...valid, color: "blue" }))).toEqual(["color", MESSAGES.invalidColor]);
  });
});
