export type CalendarRecord = {
  id: number;
  name: string;
  exam: string;
  result: string;
  secondExamDate: string;
  secondResult: string;
};

export type ExamEvent = {
  id: string;
  recordId: number;
  name: string;
  date: string;
  label: "الأول" | "الثاني";
  result: string;
};

export function getMonthCells(year: number, monthIndex: number): Array<number | null> {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

export function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getExamEvents(records: CalendarRecord[]): ExamEvent[] {
  return records.flatMap((record) => {
    const events: ExamEvent[] = [];
    if (record.exam) events.push({ id: `${record.id}-first`, recordId: record.id, name: record.name, date: record.exam, label: "الأول", result: record.result });
    if (record.secondExamDate) events.push({ id: `${record.id}-second`, recordId: record.id, name: record.name, date: record.secondExamDate, label: "الثاني", result: record.secondResult });
    return events;
  });
}
