import { describe, expect, it } from "vitest";
import { getExamEvents, getMonthCells, toDateKey } from "./calendar-utils";

describe("exam calendar utilities", () => {
  it("creates a complete Sunday-first month grid", () => {
    const cells = getMonthCells(2026, 1);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((day) => day !== null)).toHaveLength(28);
    expect(cells).toContain(1);
    expect(cells).toContain(28);
  });

  it("formats calendar dates as ISO date keys", () => {
    expect(toDateKey(2026, 0, 7)).toBe("2026-01-07");
  });

  it("collects both exam dates without inventing events", () => {
    const events = getExamEvents([{ id: 4, name: "محمد", exam: "2026-01-07", result: "ناجح", secondExamDate: "2026-02-12", secondResult: "قيد المعالجة" }]);
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.label)).toEqual(["الأول", "الثاني"]);
    expect(events.map((event) => event.date)).toEqual(["2026-01-07", "2026-02-12"]);
  });
});
