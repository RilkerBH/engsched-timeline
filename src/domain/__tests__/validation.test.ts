import { describe, expect, it } from "vitest";
import { MESSAGES, isWithinRange, milestoneSchema, projectSettingsSchema, servicePackageSchema } from "@/domain/validation";

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

describe("servicePackageSchema", () => {
  const valid = { name: "a", startDate: "2026-02-01", endDate: "2026-02-01", color: "#4472C4", height: 32, showTextInside: false };
  const schema = servicePackageSchema(project);

  it("accepts a single-day package inside the project", () => {
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
