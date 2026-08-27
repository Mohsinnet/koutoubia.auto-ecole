import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Archive, ArrowDownToLine, BarChart3, Check, ClipboardList, FileSpreadsheet, Menu, Pencil, Plus, RefreshCw, Search, Trash2, UserRound, Users, X } from "lucide-react";
import { toLicensePayload, toLicenseRecord, type LicenseRecordRow } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { canAccessDashboard } from "@/lib/auth-gate";
import { calculateRemaining, formatMoney, toggleMenu } from "@/lib/payment-utils";

type Result = "ناجح" | "راسب" | "قيد المعالجة";
type RecordItem = {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  photoUrl: string;
  photoKey: string;
  vehicleNumber: "" | "48040-د-26" | "50529-د-26";
  totalAmount: number;
  firstPayment: number;
  secondPayment: number;
  remainingAmount: number;
  secondExamDate: string;
  secondResult: Result | "";
  name: string;
  birth: string;
  phone: string;
  idCard: string;
  exam: string;
  category: string;
  result: Result;
  notes: string;
};

type FormState = Omit<RecordItem, "id">;

const emptyForm: FormState = {
  registrationNumber: "",
  registrationDate: new Date().toISOString().slice(0, 10),
  photoUrl: "",
  photoKey: "",
  vehicleNumber: "",
  totalAmount: 0,
  firstPayment: 0,
  secondPayment: 0,
  remainingAmount: 0,
  name: "",
  birth: "",
  phone: "",
  idCard: "",
  exam: "",
  category: "B",
  result: "ناجح",
  secondExamDate: "",
  secondResult: "",
  notes: "",
};

function formatDate(value: string) {
  if (!value) return "—";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}


function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1)).join("") || "؟";
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const uploadPhoto = trpc.uploadCandidatePhoto.useMutation();
  const recordsQuery = trpc.licenseRecords.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const createRecord = trpc.licenseRecords.create.useMutation();
  const updateRecord = trpc.licenseRecords.update.useMutation();
  const deleteRecord = trpc.licenseRecords.remove.useMutation();

  async function syncRecords(showToast = false) {
    setSyncing(true);
    const result = await recordsQuery.refetch();
    if (result.error) {
      setConnectionError("تعذر الاتصال بقاعدة البيانات");
      toast.error("تعذر مزامنة السجلات مع Supabase");
    } else {
      setConnectionError(null);
      const rows = (result.data ?? []) as LicenseRecordRow[];
      setRecords(rows.map(toLicenseRecord));
      if (showToast) toast.success(`تمت المزامنة — ${rows.length} سجل`);
    }
    setLoading(false);
    setSyncing(false);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(recordsQuery.isLoading);
    if (recordsQuery.data) setRecords((recordsQuery.data as LicenseRecordRow[]).map(toLicenseRecord));
    if (recordsQuery.error) setConnectionError("تعذر الاتصال بقاعدة البيانات");
  }, [isAuthenticated, recordsQuery.data, recordsQuery.error, recordsQuery.isLoading]);

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

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, registrationDate: new Date().toISOString().slice(0, 10) });
    setIsFormOpen(true);
  }

  function openEdit(item: RecordItem) {
    setEditingId(item.id);
    setForm({ registrationNumber: item.registrationNumber, registrationDate: item.registrationDate, photoUrl: item.photoUrl, photoKey: item.photoKey, vehicleNumber: item.vehicleNumber, totalAmount: item.totalAmount, firstPayment: item.firstPayment, secondPayment: item.secondPayment, remainingAmount: item.remainingAmount, name: item.name, birth: item.birth, phone: item.phone, idCard: item.idCard, exam: item.exam, category: item.category, result: item.result, secondExamDate: item.secondExamDate, secondResult: item.secondResult, notes: item.notes });
    setIsFormOpen(true);
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("اختر ملف صورة فقط"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة يجب ألا يتجاوز 5 ميغابايت"); return; }
    setPhotoUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
        reader.readAsDataURL(file);
      });
      const uploaded = await uploadPhoto.mutateAsync({ dataUrl });
      setForm((current) => ({ ...current, photoUrl: uploaded.url, photoKey: uploaded.key }));
      toast.success("تم رفع صورة المترشح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر رفع الصورة");
    } finally {
      setPhotoUploading(false);
    }
  }

  function updatePayment(field: "totalAmount" | "firstPayment" | "secondPayment", value: string) {
    setForm((current) => {
      const next = { ...current, [field]: Math.max(0, Number(value) || 0) };
      next.remainingAmount = calculateRemaining(next.totalAmount, next.firstPayment, next.secondPayment);
      return next;
    });
  }

  async function saveRecord(event: FormEvent) {
    event.preventDefault();
    if (!form.registrationNumber.trim() || !form.name.trim() || !form.registrationDate || !form.exam) {
      toast.error("يرجى إدخال رقم التسجيل والاسم وتاريخ التسجيل وتاريخ الامتحان");
      return;
    }
    const payload = toLicensePayload(form);
    try {
      const data = editingId ? await updateRecord.mutateAsync({ id: editingId, ...payload }) : await createRecord.mutateAsync(payload);
      const saved = toLicenseRecord(data as LicenseRecordRow);
      setRecords((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]);
      setIsFormOpen(false);
      toast.success(editingId ? "تم تحديث بيانات المترشح" : "تم حفظ بيانات المترشح");
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر حفظ البيانات";
      toast.error(message.includes("CONFLICT") || message.includes("duplicate") ? "رقم التسجيل مستخدم من قبل" : message);
    }
  }

  async function removeRecord(id: number) {
    if (!window.confirm("هل تريد حذف هذا السجل نهائيًا؟")) return;
    try {
      await deleteRecord.mutateAsync({ id });
      setRecords((current) => current.filter((item) => item.id !== id));
      toast.success("تم حذف السجل");
    } catch (error) { toast.error(error instanceof Error ? error.message : "تعذر حذف السجل"); }
  }

  function exportCsv() {
    const header = ["رقم التسجيل", "تاريخ التسجيل", "الاسم واللقب", "تاريخ الميلاد", "رقم الهاتف", "رقم بطاقة التعريف", "رقم العربة", "الثمن الإجمالي (درهم)", "الدفعة الأولى (درهم)", "الدفعة الثانية (درهم)", "الباقي (درهم)", "تاريخ الامتحان الأول", "فئة الرخصة", "النتيجة", "تاريخ الامتحان الثاني", "نتيجة الامتحان الثاني", "ملاحظات"];
    const rows = records.map((item) => [item.registrationNumber, item.registrationDate, item.name, item.birth, item.phone, item.idCard, item.vehicleNumber, formatMoney(item.totalAmount), formatMoney(item.firstPayment), formatMoney(item.secondPayment), formatMoney(item.remainingAmount), item.exam, item.category, item.result, item.secondExamDate, item.secondResult, item.notes]);
    const csv = "\\ufeff" + [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "سجل_المترشحين.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success("تم تجهيز ملف Excel");
  }

  if (authLoading) return <AuthLoading />;
  if (!canAccessDashboard(isAuthenticated, authLoading)) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-[#173840]" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-20 hidden w-[270px] flex-col bg-[#0d3943] text-white lg:flex">
        <div className="border-b border-white/10 px-7 py-7"><div className="flex items-center gap-3"><img src="/manus-storage/sayarat-mark_49992088.png" alt="" className="h-12 w-12" /><div><div className="font-bold">سيارة التعليم الكتبية</div><div className="mt-1 text-[11px] text-[#a9c8c5]">السجل الرقمي</div></div></div></div>
        <div className="px-5 py-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8db4b1]">مساحة العمل</p><nav className="space-y-2"><button className="nav-item nav-active"><ClipboardList size={18} /> السجل اليومي</button><button className="nav-item"><Users size={18} /> المترشحون</button><button className="nav-item"><BarChart3 size={18} /> التقارير</button></nav></div>
        <div className="mt-auto px-6 pb-7"><div className="rounded-2xl border border-white/20 bg-white/5 p-4"><div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full ${connectionError ? "bg-[#fff0e5] text-[#c45d25]" : "bg-[#d8f1e0] text-[#27734d]"}`}><Check size={17} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold">{user?.name || user?.email || "حساب المستخدم"}</p><p className="mt-1 text-[10px] text-[#a9c8c5]">{connectionError ? "تحقق من الإعدادات" : "جلسة دخول مفعّلة"}</p></div></div><div className="mt-4 h-1 rounded-full bg-white/10"><div className={`h-full rounded-full bg-[#e8793a] transition-all ${syncing ? "w-1/3" : "w-full"}`} /></div><button onClick={() => void logout()} className="mt-4 w-full rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[#d7e8e5] transition hover:bg-white/10">تسجيل الخروج</button></div></div>
      </aside>

      <main className="lg:mr-[270px]">{isMobileMenuOpen && <div className="fixed right-4 top-[78px] z-30 w-64 rounded-2xl border border-[#e5ded2] bg-white p-3 shadow-xl lg:hidden"><p className="px-3 py-2 text-[11px] font-bold text-[#8b9998]">مساحة العمل</p><button onClick={() => setIsMobileMenuOpen(false)} className="nav-item nav-active w-full"><ClipboardList size={17} /> السجل اليومي</button><button onClick={() => { setIsMobileMenuOpen(false); toast.info("قسم المترشحين متاح من السجل اليومي حاليًا"); }} className="nav-item w-full"><Users size={17} /> المترشحون</button><button onClick={() => { setIsMobileMenuOpen(false); toast.info("التقارير قيد الإعداد"); }} className="nav-item w-full"><BarChart3 size={17} /> التقارير</button></div>}
        <header className="sticky top-0 z-10 border-b border-[#e5ded2] bg-[#fbfaf7]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-12"><div className="route-strip" aria-hidden="true"><span /><span /><span /><span /><span /></div><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><button onClick={() => setIsMobileMenuOpen((open) => toggleMenu(open))} className="icon-button lg:hidden" aria-label="القائمة" aria-expanded={isMobileMenuOpen}><Menu size={19} /></button><div className="hidden lg:block"><p className="text-[11px] font-bold tracking-[0.15em] text-[#e8793a]">لوحة متابعة المترشحين</p><h1 className="mt-1 text-2xl font-bold">السجل اليومي <span className="font-normal text-[#8c9a99]">/ إدارة البيانات</span></h1></div><div className="lg:hidden"><p className="text-sm font-bold">سيارة التعليم الكتبية</p><p className="text-[10px] text-[#809493]">السجل الرقمي</p></div></div><div className="flex items-center gap-2"><button onClick={() => void syncRecords(true)} disabled={syncing} className="secondary-button"><RefreshCw size={16} className={syncing ? "animate-spin" : ""} /><span className="hidden sm:inline">{syncing ? "جارٍ المزامنة" : "مزامنة البيانات"}</span></button><button onClick={openNew} className="primary-button"><Plus size={17} /> <span>حفظ مترشح</span></button></div></div></header>

        <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm text-[#7c8d8d]"><span className={`direction-dot ${connectionError ? "offline-dot" : ""}`} />{connectionError || "متصل بقاعدة البيانات"}{connectionError && <button onClick={() => void syncRecords(true)} className="mr-3 font-bold text-[#e8793a] underline underline-offset-4">إعادة المحاولة</button>}</p><h2 className="text-3xl font-bold tracking-tight">ملخص السجلات <span className="inline-block h-2 w-2 rounded-full bg-[#e8793a] align-middle" /></h2></div><p className="text-xs text-[#7d908f]">آخر مزامنة: {new Date().toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</p></div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="إجمالي المترشحين" value={stats.total} detail="كل الملفات المسجلة" icon={Archive} tone="navy" /><StatCard label="ناجحون" value={stats.passed} detail="نتيجة الامتحان" icon={Check} tone="green" /><StatCard label="قيد المعالجة" value={stats.pending} detail="تحتاج متابعة" icon={ClipboardList} tone="orange" /><StatCard label="إعادات الامتحان" value={stats.failed} detail="ملفات راسبة" icon={UserRound} tone="sand" /></section>

          <section className="mt-8 overflow-hidden rounded-[22px] border border-[#e4ded4] bg-white shadow-[0_12px_40px_rgba(30,60,62,0.055)]"><div className="lane-divider" aria-hidden="true" /><div className="flex flex-col gap-4 border-b border-[#eee9e1] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h3 className="text-lg font-bold">سجل المترشحين</h3><p className="mt-1 text-xs text-[#8b9998]">بيانات محفوظة ومزامنة مباشرة مع Supabase</p></div><div className="flex items-center gap-3"><div className="relative flex-1 sm:w-72"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa0a0]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو رقم التسجيل..." className="h-10 w-full rounded-xl border border-[#e6e0d7] bg-[#fbfaf7] pr-10 pl-3 text-sm outline-none transition focus:border-[#e8793a] focus:ring-2 focus:ring-[#e8793a]/10" /></div><button onClick={openNew} className="icon-button" aria-label="إضافة مترشح"><Plus size={19} /></button></div></div>
            <div className="overflow-x-auto">{loading ? <div className="flex items-center justify-center gap-3 py-20 text-sm text-[#7c8d8d]"><span className="loading-spinner" /> جارٍ تحميل البيانات...</div> : filteredRecords.length === 0 ? <div className="py-20 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#e8793a]"><Users size={28} /></div><p className="font-semibold text-[#36585d]">لا توجد سجلات حاليًا</p><p className="mt-1 text-sm text-[#98a7a6]">أضف أول مترشح ليظهر في الجدول.</p><button onClick={openNew} className="primary-button mx-auto mt-5"><Plus size={16} /> إضافة مترشح</button></div> : <table className="w-full min-w-[1000px] text-right"><thead><tr className="bg-[#fbfaf7] text-[11px] font-bold text-[#8a9998]"><th className="px-5 py-4">الصورة</th><th className="px-4 py-4">رقم التسجيل</th><th className="px-4 py-4">المترشح</th><th className="px-4 py-4">تاريخ التسجيل</th><th className="px-4 py-4">العربة</th><th className="px-4 py-4">الامتحان الأول</th><th className="px-4 py-4">الامتحان الثاني</th><th className="px-4 py-4">المدفوعات</th><th className="px-4 py-4">الفئة</th><th className="px-5 py-4">إجراء</th></tr></thead><tbody className="divide-y divide-[#f0ece6]">{filteredRecords.map((item) => <tr key={item.id} className="group transition hover:bg-[#fffaf5]"><td className="px-5 py-4">{item.photoUrl ? <img src={item.photoUrl} alt={`صورة ${item.name}`} className="h-11 w-11 rounded-xl object-cover ring-2 ring-[#f1e6dc]" /> : <div className="avatar">{initials(item.name)}</div>}</td><td className="px-4 py-4"><span className="font-mono text-sm font-bold text-[#254950]">{item.registrationNumber || `#${item.id}`}</span></td><td className="px-4 py-4"><div><div className="text-sm font-semibold text-[#254950]">{item.name}</div><div className="mt-1 text-[11px] text-[#a2acab]">بطاقة: {item.idCard ? `${item.idCard.slice(0, 5)}••••••` : "غير مسجلة"}</div></div></td><td className="px-4 py-4 text-sm text-[#536d70]">{formatDate(item.registrationDate)}</td><td className="px-4 py-4 text-xs font-semibold text-[#536d70]">{item.vehicleNumber || "—"}</td><td className="px-4 py-4"><div className="text-sm text-[#536d70]">{formatDate(item.exam)}</div><div className="mt-1"><ResultBadge value={item.result} /></div></td><td className="px-4 py-4"><div className="text-sm text-[#536d70]">{formatDate(item.secondExamDate)}</div>{item.secondResult && <div className="mt-1"><ResultBadge value={item.secondResult} /></div>}</td><td className="px-4 py-4 text-xs text-[#536d70]"><div>الإجمالي: {formatMoney(item.totalAmount)}</div><div className="mt-1">الدفعة الأولى: {formatMoney(item.firstPayment)}</div><div className="mt-1">الدفعة الثانية: {formatMoney(item.secondPayment)}</div><div className="mt-1 font-semibold text-[#e8793a]">الباقي: {formatMoney(item.remainingAmount)}</div></td><td className="px-4 py-4"><span className="category-chip">{item.category}</span></td><td className="px-5 py-4"><div className="flex items-center gap-1 opacity-60 transition group-hover:opacity-100"><button onClick={() => openEdit(item)} className="table-action" aria-label="تعديل"><Pencil size={15} /></button><button onClick={() => void removeRecord(item.id)} className="table-action danger" aria-label="حذف"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>}</div><div className="flex flex-col gap-3 border-t border-[#eee9e1] px-7 py-4 text-xs text-[#8b9998] sm:flex-row sm:items-center sm:justify-between"><span>عرض {filteredRecords.length} من {records.length} سجلات</span><button onClick={exportCsv} className="flex items-center gap-2 font-semibold text-[#e8793a] transition hover:text-[#bb5621]"><FileSpreadsheet size={15} /> تنزيل نسخة Excel</button></div></section>
        </div>
      </main>

      {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09252b]/45 p-4 backdrop-blur-sm"><form onSubmit={saveRecord} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-[#fbfaf7] shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e9e2d8] bg-[#fbfaf7] px-6 py-5 sm:px-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e8793a]">{editingId ? "تعديل السجل" : "تسجيل مترشح جديد"}</p><h3 className="mt-1 text-xl font-bold">{editingId ? "تحديث بيانات المترشح" : "إضافة بيانات إلى السجل"}</h3></div><button type="button" onClick={() => setIsFormOpen(false)} className="icon-button" aria-label="إغلاق"><X size={18} /></button></div><div className="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8"><div className="sm:col-span-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#e7d9cc] bg-[#fffaf5] p-5"><div className="relative">{form.photoUrl ? <img src={form.photoUrl} alt="معاينة صورة المترشح" className="h-28 w-28 rounded-2xl object-cover ring-4 ring-white shadow-md" /> : <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[#e9f0ed] text-3xl font-bold text-[#5f7c7c]">{initials(form.name)}</div>}<label className="absolute -bottom-2 -left-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#e8793a] text-white shadow-lg"><Plus size={17} /><input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" /></label></div><div className="text-center"><p className="text-sm font-bold">صورة المترشح</p><p className="mt-1 text-xs text-[#8b9998]">JPG أو PNG أو WebP — الحد الأقصى 5MB</p>{photoUploading && <p className="mt-2 text-xs font-semibold text-[#e8793a]">جارٍ رفع الصورة...</p>}</div></div><Field label="الاسم واللقب" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="مثال: محمد بن علي" /><Field label="تاريخ الميلاد" type="date" value={form.birth} onChange={(value) => setForm({ ...form, birth: value })} /><Field label="رقم الهاتف" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="0550 00 00 00" /><Field label="رقم بطاقة التعريف الوطنية" value={form.idCard} onChange={(value) => setForm({ ...form, idCard: value })} /><Field label="رقم التسجيل" required value={form.registrationNumber} onChange={(value) => setForm({ ...form, registrationNumber: value })} placeholder="مثال: 2026-001" /><Field label="تاريخ التسجيل" type="date" required value={form.registrationDate} onChange={(value) => setForm({ ...form, registrationDate: value })} /><SelectField label="رقم العربة (اختياري)" value={form.vehicleNumber} options={["", "48040-د-26", "50529-د-26"]} onChange={(value) => setForm({ ...form, vehicleNumber: value as FormState["vehicleNumber"] })} /><Field label="الثمن الإجمالي (درهم)" type="number" value={String(form.totalAmount)} onChange={(value) => updatePayment("totalAmount", value)} placeholder="0" /><Field label="الدفعة الأولى (درهم)" type="number" value={String(form.firstPayment)} onChange={(value) => updatePayment("firstPayment", value)} placeholder="0" /><Field label="الدفعة الثانية (درهم)" type="number" value={String(form.secondPayment)} onChange={(value) => updatePayment("secondPayment", value)} placeholder="0" /><Field label="الباقي (درهم)" type="number" value={String(form.remainingAmount)} onChange={() => undefined} /><SelectField label="فئة الرخصة" value={form.category} options={["A", "A1", "B", "C", "D", "E"]} onChange={(value) => setForm({ ...form, category: value })} /><Field label="تاريخ الامتحان الأول" type="date" required value={form.exam} onChange={(value) => setForm({ ...form, exam: value })} /><SelectField label="نتيجة الامتحان الأول" value={form.result} options={["ناجح", "راسب", "قيد المعالجة"]} onChange={(value) => setForm({ ...form, result: value as Result })} /><Field label="تاريخ الامتحان الثاني (اختياري)" type="date" value={form.secondExamDate} onChange={(value) => setForm({ ...form, secondExamDate: value })} /><SelectField label="نتيجة الامتحان الثاني (اختياري)" value={form.secondResult} options={["", "ناجح", "راسب", "قيد المعالجة"]} onChange={(value) => setForm({ ...form, secondResult: value as FormState["secondResult"] })} /><div className="sm:col-span-2"><label className="field-label">ملاحظات</label><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} placeholder="أضف ملاحظة اختيارية..." className="field-input resize-none" /></div></div><div className="flex items-center justify-between border-t border-[#e9e2d8] bg-white px-6 py-4 sm:px-8"><span className="text-xs text-[#8b9998]">سيتم حفظ البيانات في Supabase</span><div className="flex items-center gap-3"><button type="button" onClick={() => setIsFormOpen(false)} className="secondary-button">إلغاء</button><button type="submit" disabled={photoUploading} className="primary-button"><Check size={16} /> حفظ البيانات</button></div></div></form></div>}
    </div>
  );
}

function AuthLoading() { return <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb]" dir="rtl"><div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 text-sm text-[#536d70] shadow-lg"><span className="loading-spinner" /> جارٍ التحقق من جلسة الدخول...</div></div>; }
function LoginScreen() { return <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d3943] px-5 py-10" dir="rtl"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #e8793a 0 2px, transparent 3px), linear-gradient(135deg, transparent 0 48%, #e8793a 49% 51%, transparent 52%)", backgroundSize: "42px 42px, 180px 180px" }} /><div className="relative w-full max-w-md rounded-[28px] border border-white/15 bg-[#fbfaf7] p-8 text-center shadow-2xl sm:p-10"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e9f0ed] shadow-inner"><img src="/manus-storage/sayarat-mark_49992088.png" alt="" className="h-14 w-14" /></div><p className="mt-7 text-xs font-bold tracking-[0.18em] text-[#e8793a]">لوحة متابعة المترشحين</p><h1 className="mt-3 text-3xl font-bold text-[#173840]">سيارة التعليم الكتبية</h1><p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-[#718584]">سجّل الدخول للوصول إلى سجلات المترشحين وبيانات رخص السياقة.</p><button onClick={() => startLogin()} className="primary-button mx-auto mt-8 w-full py-3.5 text-sm"><Users size={18} /> تسجيل الدخول</button><p className="mt-5 text-[11px] text-[#9aa8a6]">الدخول محمي بنظام المصادقة الخاص بالمؤسسة</p></div></div>; }
function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof Archive; tone: string }) { return <div className={`stat-card ${tone}`}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[#759091]">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-[#173840]">{value.toString().padStart(2, "0")}</p></div><span className="stat-icon"><Icon size={18} /></span></div><p className="mt-5 text-[11px] text-[#91a09f]">{detail}</p></div>; }
function ResultBadge({ value }: { value: Result }) { const styles = value === "ناجح" ? "success" : value === "راسب" ? "failed" : "pending"; return <span className={`result-badge ${styles}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{value}</span>; }
function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) { return <label><span className="field-label">{label}{required && <b className="mr-1 text-[#e8793a]">*</b>}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-input" /></label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><span className="field-label">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="field-input">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
