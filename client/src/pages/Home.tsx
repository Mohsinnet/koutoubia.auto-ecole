// Style: لوحة التحكم المرورية — RTL، كحلي بترولي، برتقالي إشاري، بيانات واضحة وتخطيط جانبي.
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ArrowDownToLine,
  BarChart3,
  Check,
  ChevronLeft,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type RecordItem = {
  id: number;
  name: string;
  birth: string;
  phone: string;
  idCard: string;
  exam: string;
  category: string;
  result: "ناجح" | "راسب" | "قيد المعالجة";
  notes: string;
};

const initialRecords: RecordItem[] = [
  { id: 1042, name: "عبد الرحمن بن سالم", birth: "1998-04-12", phone: "0551 24 83 10", idCard: "198765432101234", exam: "2026-08-21", category: "B", result: "ناجح", notes: "تسليم الملف الأسبوع القادم" },
  { id: 1041, name: "سارة قاسمي", birth: "2001-11-03", phone: "0662 19 44 72", idCard: "201123456701876", exam: "2026-08-20", category: "B", result: "ناجح", notes: "" },
  { id: 1040, name: "ياسين مرابط", birth: "1995-07-28", phone: "0770 31 52 68", idCard: "199598765401923", exam: "2026-08-19", category: "C", result: "قيد المعالجة", notes: "في انتظار المصادقة" },
  { id: 1039, name: "أميرة بوشارب", birth: "2002-02-16", phone: "0550 76 14 33", idCard: "202212345601145", exam: "2026-08-18", category: "B", result: "راسب", notes: "إعادة الامتحان" },
];

const emptyForm = { name: "", birth: "", phone: "", idCard: "", exam: "", category: "B", result: "ناجح" as RecordItem["result"], notes: "" };

function formatDate(value: string) {
  if (!value) return "—";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function AppLogo({ small = false }: { small?: boolean }) {
  return <img src="/manus-storage/sayarat-mark_49992088.png" alt="" className={small ? "h-9 w-9" : "h-12 w-12"} />;
}

export default function Home() {
  const [records, setRecords] = useState<RecordItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("sayarat-records") || "null") || initialRecords; } catch { return initialRecords; }
  });
  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState("السجل اليومي");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { localStorage.setItem("sayarat-records", JSON.stringify(records)); }, [records]);

  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(needle)));
  }, [query, records]);

  const stats = useMemo(() => ({
    total: records.length,
    passed: records.filter((item) => item.result === "ناجح").length,
    pending: records.filter((item) => item.result === "قيد المعالجة").length,
    failed: records.filter((item) => item.result === "راسب").length,
  }), [records]);

  function openNew() { setEditingId(null); setForm(emptyForm); setIsFormOpen(true); }
  function openEdit(item: RecordItem) {
    setEditingId(item.id);
    setForm({ name: item.name, birth: item.birth, phone: item.phone, idCard: item.idCard, exam: item.exam, category: item.category, result: item.result, notes: item.notes });
    setIsFormOpen(true);
  }
  function saveRecord(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.exam) { toast.error("يرجى إدخال الاسم وتاريخ الامتحان"); return; }
    if (editingId) {
      setRecords((current) => current.map((item) => item.id === editingId ? { ...item, ...form } : item));
      toast.success("تم تحديث بيانات السجل");
    } else {
      const nextId = Math.max(0, ...records.map((item) => item.id)) + 1;
      setRecords((current) => [{ id: nextId, ...form }, ...current]);
      toast.success("تم حفظ السجل الجديد");
    }
    setIsFormOpen(false);
  }
  function removeRecord(id: number) {
    if (!window.confirm("هل تريد حذف هذا السجل؟")) return;
    setRecords((current) => current.filter((item) => item.id !== id));
    toast.success("تم حذف السجل");
  }
  function exportCsv() {
    const header = ["الرقم", "الاسم واللقب", "تاريخ الميلاد", "رقم الهاتف", "رقم بطاقة التعريف", "تاريخ الامتحان", "فئة الرخصة", "النتيجة", "ملاحظات"];
    const rows = records.map((item) => [item.id, item.name, item.birth, item.phone, item.idCard, item.exam, item.category, item.result, item.notes]);
    const csv = "\\ufeff" + [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "سجل_رخص_السياقة.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success("تم تصدير السجل لفتحه في Excel");
  }

  const navItems = [{ label: "نظرة عامة", icon: LayoutDashboard }, { label: "السجل اليومي", icon: ClipboardList }, { label: "المتدربون", icon: Users }, { label: "التقارير", icon: BarChart3 }];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f3ed] text-[#173840] selection:bg-[#f6c7a8]">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-[260px] border-l border-[#244f58] bg-[#123b45] text-white lg:block">
        <div className="flex items-center gap-3 border-b border-white/10 px-7 py-7"><AppLogo /><div><div className="text-[17px] font-bold tracking-tight">سيارة التعليم</div><div className="mt-0.5 text-[11px] text-[#b9d1d0]">السجل الكتبي الرقمي</div></div></div>
        <div className="px-4 py-8"><p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#84a8a9]">مساحة العمل</p>{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActiveNav(label)} className={`nav-item ${activeNav === label ? "nav-active" : ""}`}><Icon size={18} strokeWidth={1.8} />{label}{label === "السجل اليومي" && <span className="mr-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">مباشر</span>}</button>)}</div>
        <div className="absolute inset-x-5 bottom-6 rounded-2xl border border-white/10 bg-[#1b4a54] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold">قاعدة محلية</p><p className="mt-1 text-[11px] text-[#acd0cc]">تُحفظ على هذا المتصفح</p></div><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d4efdd] text-[#28704b]"><Check size={16} /></span></div><div className="mt-4 h-1 rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-[#e8793a]" /></div></div>
      </aside>

      <main className="lg:mr-[260px]">
        <header className="relative overflow-hidden border-b border-[#e5ded2] bg-[#fbfaf7] px-5 py-5 sm:px-8 lg:px-12"><div className="route-strip" aria-hidden="true"><span /><span /><span /><span /><span /></div><img src="/manus-storage/sayarat-pattern_2137c816.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.11]" /><div className="relative flex items-center justify-between gap-4"><div className="flex items-center gap-3 lg:hidden"><AppLogo small /><div><div className="text-sm font-bold">سيارة التعليم</div><div className="text-[10px] text-[#758b8c]">السجل الكتبي الرقمي</div></div></div><div className="hidden lg:block"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e8793a]">الثلاثاء، 25 أغسطس 2026</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-[#173840]">السجل اليومي <span className="font-normal text-[#8c9a99]">/ نظرة تشغيلية</span></h1></div><div className="flex items-center gap-2"><button className="icon-button lg:hidden" aria-label="القائمة"><Menu size={20} /></button><button onClick={exportCsv} className="secondary-button"><ArrowDownToLine size={16} /> <span className="hidden sm:inline">تصدير Excel</span></button><button onClick={openNew} className="primary-button"><Plus size={17} /> إضافة سجل</button></div></div></header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-sm text-[#7c8d8d]"><span className="direction-dot" /> مرحبًا بك في مساحة الإدارة</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-[#173840]">ملخص السجلات <span className="inline-block h-2 w-2 rounded-full bg-[#e8793a] align-middle" /></h2></div><div className="hidden items-center gap-2 text-xs text-[#708486] sm:flex"><span className="h-2 w-2 rounded-full bg-[#53a978]" /> آخر مزامنة محلية منذ لحظات</div></div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="إجمالي السجلات" value={stats.total} detail="كل الملفات المسجلة" icon={Archive} tone="navy" /><StatCard label="ناجحون" value={stats.passed} detail="نتيجة الامتحان" icon={Check} tone="green" /><StatCard label="قيد المعالجة" value={stats.pending} detail="تحتاج متابعة" icon={ClipboardList} tone="orange" /><StatCard label="إعادات الامتحان" value={stats.failed} detail="ملفات راسبة" icon={UserRound} tone="sand" /></section>

          <section className="mt-8 overflow-hidden rounded-[22px] border border-[#e4ded4] bg-white shadow-[0_12px_40px_rgba(30,60,62,0.055)]"><div className="lane-divider" aria-hidden="true" /><div className="flex flex-col gap-4 border-b border-[#eee9e1] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h3 className="text-lg font-bold text-[#173840]">سجل الأشخاص</h3><p className="mt-1 text-xs text-[#8b9998]">إدارة بيانات المجتازين والنتائج المسجلة</p></div><div className="flex items-center gap-3"><div className="relative flex-1 sm:w-64"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa0a0]" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في السجل..." className="h-10 w-full rounded-xl border border-[#e6e0d7] bg-[#fbfaf7] pr-10 pl-3 text-sm outline-none transition focus:border-[#e8793a] focus:ring-2 focus:ring-[#e8793a]/10" /></div><button onClick={openNew} className="icon-button" aria-label="إضافة"><Plus size={19} /></button></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right"><thead><tr className="bg-[#fbfaf7] text-[11px] font-bold text-[#8a9998]"><th className="px-7 py-4">رقم الملف</th><th className="px-4 py-4">الاسم واللقب</th><th className="px-4 py-4">تاريخ الامتحان</th><th className="px-4 py-4">الفئة</th><th className="px-4 py-4">رقم الهاتف</th><th className="px-4 py-4">النتيجة</th><th className="px-7 py-4">إجراء</th></tr></thead><tbody className="divide-y divide-[#f0ece6]">{filteredRecords.map((item) => <tr key={item.id} className="group transition hover:bg-[#fffaf5]"><td className="px-7 py-5 font-mono text-xs text-[#8b9998]">#{item.id}</td><td className="px-4 py-5"><div className="flex items-center gap-3"><div className="avatar">{item.name.split(" ")[0]?.slice(0, 1)}</div><div><div className="text-sm font-semibold text-[#254950]">{item.name}</div><div className="mt-1 text-[11px] text-[#a2acab]">بطاقة: {item.idCard.slice(0, 5)}••••••</div></div></div></td><td className="px-4 py-5 text-sm text-[#536d70]">{formatDate(item.exam)}</td><td className="px-4 py-5"><span className="category-chip">{item.category}</span></td><td className="px-4 py-5 text-sm text-[#536d70]" dir="ltr">{item.phone}</td><td className="px-4 py-5"><ResultBadge value={item.result} /></td><td className="px-7 py-5"><div className="flex items-center gap-1 opacity-60 transition group-hover:opacity-100"><button onClick={() => openEdit(item)} className="table-action" aria-label="تعديل"><Pencil size={15} /></button><button onClick={() => removeRecord(item.id)} className="table-action danger" aria-label="حذف"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{filteredRecords.length === 0 && <div className="py-16 text-center"><img src="/manus-storage/sayarat-route_fa58391e.png" alt="" className="mx-auto mb-4 h-24 w-32 object-contain opacity-70" /><p className="font-semibold text-[#36585d]">لا توجد نتائج مطابقة</p><p className="mt-1 text-sm text-[#98a7a6]">جرّب كلمة بحث أخرى أو أضف سجلًا جديدًا.</p></div>}</div><div className="flex items-center justify-between border-t border-[#eee9e1] px-7 py-4 text-xs text-[#8b9998]"><span>عرض {filteredRecords.length} من {records.length} سجلات</span><button onClick={exportCsv} className="flex items-center gap-2 font-semibold text-[#e8793a] transition hover:text-[#bb5621]"><FileSpreadsheet size={15} /> تنزيل نسخة Excel</button></div></section>
        </div>
      </main>

      {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09252b]/40 p-4 backdrop-blur-sm"><form onSubmit={saveRecord} className="w-full max-w-2xl overflow-hidden rounded-[24px] bg-[#fbfaf7] shadow-2xl"><div className="flex items-start justify-between border-b border-[#e9e2d8] px-6 py-5 sm:px-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e8793a]">{editingId ? "تعديل البيانات" : "سجل جديد"}</p><h3 className="mt-1 text-xl font-bold text-[#173840]">{editingId ? "تحديث بيانات المجتاز" : "إضافة شخص إلى السجل"}</h3></div><button type="button" onClick={() => setIsFormOpen(false)} className="icon-button"><X size={18} /></button></div><div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-8"><Field label="الاسم واللقب" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="مثال: محمد بن علي" /><Field label="تاريخ الميلاد" type="date" value={form.birth} onChange={(value) => setForm({ ...form, birth: value })} /><Field label="رقم الهاتف" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="0550 00 00 00" /><Field label="رقم بطاقة التعريف" value={form.idCard} onChange={(value) => setForm({ ...form, idCard: value })} /><Field label="تاريخ الامتحان" type="date" required value={form.exam} onChange={(value) => setForm({ ...form, exam: value })} /><SelectField label="فئة الرخصة" value={form.category} options={["A", "A1", "B", "C", "D", "E"]} onChange={(value) => setForm({ ...form, category: value })} /><SelectField label="النتيجة" value={form.result} options={["ناجح", "راسب", "قيد المعالجة"]} onChange={(value) => setForm({ ...form, result: value as RecordItem["result"] })} /><div className="sm:col-span-2"><label className="field-label">ملاحظات</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="أضف ملاحظة اختيارية..." className="field-input resize-none" /></div></div><div className="flex items-center justify-end gap-3 border-t border-[#e9e2d8] bg-white px-6 py-4 sm:px-8"><button type="button" onClick={() => setIsFormOpen(false)} className="secondary-button">إلغاء</button><button type="submit" className="primary-button"><Check size={16} /> حفظ السجل</button></div></form></div>}
    </div>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof Archive; tone: string }) { return <div className={`stat-card ${tone}`}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[#759091]">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-[#173840]">{value.toString().padStart(2, "0")}</p></div><span className="stat-icon"><Icon size={18} /></span></div><p className="mt-5 text-[11px] text-[#91a09f]">{detail}</p></div>; }
function ResultBadge({ value }: { value: RecordItem["result"] }) { const styles = value === "ناجح" ? "success" : value === "راسب" ? "failed" : "pending"; return <span className={`result-badge ${styles}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{value}</span>; }
function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) { return <label><span className="field-label">{label}{required && <b className="mr-1 text-[#e8793a]">*</b>}</span><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field-input" /></label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><span className="field-label">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="field-input">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
