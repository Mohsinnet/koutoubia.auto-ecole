import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const calendarSource = readFileSync(new URL("../components/ExamCalendar.tsx", import.meta.url), "utf8");

describe("exam calendar interaction", () => {
  it("makes each calendar day selectable and keeps the selected date visible", () => {
    expect(calendarSource).toContain("setSelectedDate(dateKey)");
    expect(calendarSource).toContain('aria-pressed={selected}');
    expect(calendarSource).toContain('aria-labelledby="selected-exam-date"');
  });

  it("shows the candidate name, exam label, and result for the selected date", () => {
    expect(calendarSource).toContain("selectedEvents.map((event)");
    expect(calendarSource).toContain("{event.name}");
    expect(calendarSource).toContain("الامتحان {event.label}");
    expect(calendarSource).toContain("event.result || \"غير محدد\"");
  });
});
