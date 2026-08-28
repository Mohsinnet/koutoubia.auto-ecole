import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const calendarSource = readFileSync(new URL("../components/ExamCalendar.tsx", import.meta.url), "utf8");
const cardSource = readFileSync(new URL("../components/CandidateCard.tsx", import.meta.url), "utf8");

describe("candidate features wiring", () => {
  it("wires the table action to the candidate card", () => {
    expect(homeSource).toContain("setViewingRecord(item)");
    expect(homeSource).toContain("مشاهدة البطاقة");
    expect(homeSource).toContain("<CandidateCard record={viewingRecord}");
    expect(cardSource).toContain("بطاقة المترشح");
  });

  it("wires photo removal to storage and the database record", () => {
    expect(homeSource).toContain("async function removePhoto");
    expect(homeSource).toContain('.storage.from("candidate-photos").remove');
    expect(homeSource).toContain("photo_url: null, photo_key: null");
    expect(homeSource).toContain("إزالة");
  });

  it("renders the exam calendar in the reports area", () => {
    expect(homeSource).toContain("<ExamCalendar records={records} />");
    expect(calendarSource).toContain("getMonthCells");
    expect(calendarSource).toContain("الامتحان الأول");
    expect(calendarSource).toContain("الامتحان الثاني");
  });
});
