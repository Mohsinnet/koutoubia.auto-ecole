import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../components/CandidateCard.tsx", import.meta.url), "utf8");
const calendarSource = readFileSync(new URL("../components/ExamCalendar.tsx", import.meta.url), "utf8");
const tableSource = readFileSync(new URL("../components/CandidateTable.tsx", import.meta.url), "utf8");

describe("date display wiring", () => {
  it("uses the shared formatter in the visible table and CSV export", () => {
    expect(tableSource).toContain('import { formatDisplayDate } from "@/lib/date-utils"');
    expect(tableSource).toContain("formatDisplayDate(item.registrationDate)");
    expect(tableSource).toContain("formatDisplayDate(date)");
    expect(tableSource).toContain('<ExamLine label="الأول" date={item.exam} result={item.result} />');
    expect(tableSource).toContain('<ExamLine label="الثاني" date={item.secondExamDate} result={item.secondResult} />');
    expect(homeSource).toContain("formatDisplayDate(item.birth)");
    expect(homeSource).toContain("formatDisplayDate(item.registrationDate)");
    expect(homeSource).toContain("formatDisplayDate(item.exam)");
    expect(homeSource).toContain("formatDisplayDate(item.secondExamDate)");
  });

  it("uses the shared formatter in the candidate card and selected calendar date", () => {
    expect(cardSource).toContain('import { formatDisplayDate } from "@/lib/date-utils"');
    expect(cardSource).toContain("formatDisplayDate(record.registrationDate)");
    expect(cardSource).toContain("formatDisplayDate(record.birth)");
    expect(cardSource).toContain("formatDisplayDate(record.exam)");
    expect(cardSource).toContain("formatDisplayDate(record.secondExamDate)");
    expect(calendarSource).toContain('import { formatDisplayDate } from "@/lib/date-utils"');
    expect(calendarSource).toContain("return formatDisplayDate(value)");
  });
});
