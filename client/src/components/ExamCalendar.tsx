import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getExamEvents, getMonthCells, toDateKey, type CalendarRecord, type ExamEvent } from "@/lib/calendar-utils";

type ExamCalendarProps = { records: CalendarRecord[] };

const weekDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function ExamCalendar({ records }: ExamCalendarProps) {
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const year = calendarDate.getFullYear();
  const monthIndex = calendarDate.getMonth();
  const cells = getMonthCells(year, monthIndex);
  const events = useMemo(() => getExamEvents(records), [records]);
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, ExamEvent[]>>((grouped, event) => {
      const dateKey = event.date.slice(0, 10);
      grouped[dateKey] = [...(grouped[dateKey] || []), event];
      return grouped;
    }, {});
  }, [events]);
  const monthLabel = new Intl.DateTimeFormat("ar-MA", { month: "long", year: "numeric" }).format(calendarDate);
  const monthEventCount = events.filter((event) => event.date.slice(0, 7) === `${year}-${String(monthIndex + 1).padStart(2, "0")}`).length;

  function changeMonth(offset: number) {
    setCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return <section className="mt-8 rounded-[22px] border border-[#e4ded4] bg-white p-5 shadow-[0_12px_40px_rgba(30,60,62,0.055)] sm:p-6" aria-labelledby="exam-calendar-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#e8793a]"><CalendarDays size={21} /></div>
        <div><h3 id="exam-calendar-title" className="text-lg font-bold">تقويم الامتحانات</h3><p className="mt-1 text-xs text-[#8b9998]">تظهر مواعيد الامتحان الأول والثاني داخل اليوم المحدد.</p></div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <button type="button" onClick={() => changeMonth(-1)} className="icon-button" aria-label="الشهر السابق" title="الشهر السابق"><ChevronRight size={17} /></button>
        <strong className="min-w-36 text-center text-sm text-[#254950]">{monthLabel}</strong>
        <button type="button" onClick={() => changeMonth(1)} className="icon-button" aria-label="الشهر التالي" title="الشهر التالي"><ChevronLeft size={17} /></button>
      </div>
    </div>
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#eee9e1]">
      <div className="grid grid-cols-7 border-b border-[#eee9e1] bg-[#fbfaf7] text-center text-[10px] font-bold text-[#8b9998] sm:text-xs">{weekDays.map((day) => <div key={day} className="px-1 py-3 sm:px-2">{day}</div>)}</div>
      <div className="grid grid-cols-7">{cells.map((day, index) => {
        const dateKey = day ? toDateKey(year, monthIndex, day) : "";
        const dayEvents = dateKey ? eventsByDate[dateKey] || [] : [];
        return <div key={`${dateKey || "empty"}-${index}`} className={`min-h-24 border-b border-l border-[#f0ece6] p-1.5 last:border-l-0 sm:min-h-28 sm:p-2 ${day ? "bg-white" : "bg-[#fbfaf7]/70"}`}>
          {day && <><div className="flex items-center justify-between"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${dayEvents.length ? "bg-[#0d3943] text-white" : "text-[#536d70]"}`}>{day}</span>{dayEvents.length > 2 && <span className="text-[10px] font-bold text-[#e8793a]">+{dayEvents.length - 2}</span>}</div><div className="mt-2 space-y-1">{dayEvents.slice(0, 2).map((event) => <div key={event.id} className={`truncate rounded-lg px-1.5 py-1 text-[9px] font-semibold sm:text-[10px] ${event.label === "الأول" ? "bg-[#e9f0ed] text-[#276653]" : "bg-[#fff1e8] text-[#b65d2f]"}`} title={`${event.name} — الامتحان ${event.label} — ${event.result}`}>{event.label} · {event.name}</div>)}</div></>}
        </div>;
      })}</div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#718482]"><span className="font-semibold">{monthEventCount} موعدًا في هذا الشهر</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#4d927c]" /> الامتحان الأول</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#e8793a]" /> الامتحان الثاني</span></div>
  </section>;
}
