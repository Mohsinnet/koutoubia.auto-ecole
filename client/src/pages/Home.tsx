import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Archive, BarChart3, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, FileSpreadsheet, House, Images, Menu, Plus, RefreshCw, Search, UserPlus, UserRound, Users, X } from "lucide-react";
import { supabase, supabaseConfigured, toLicensePayload, toLicenseRecord, type LicenseRecordForm, type LicenseRecordRow } from "@/lib/supabase";
import { calculateRemaining, formatMoney, toggleMenu } from "@/lib/payment-utils";
import { ADMIN_USERNAME, isAdminUsername } from "@/lib/admin-auth";
import { isSectionActive, sectionMeta, type ActiveSection } from "@/lib/navigation";
import ExamCalendar from "@/components/ExamCalendar";
import CandidateCard from "@/components/CandidateCard";
import CandidateTable from "@/components/CandidateTable";
import { formatDisplayDate } from "@/lib/date-utils";

type Result = "ناجح" | "راسب" | "قيد المعالجة";
type RecordItem = ReturnType<typeof toLicenseRecord>;
type FormState = LicenseRecordForm;

const emptyForm: FormState = {
  registrationNumber: "", registrationDate: new Date().toISOString().slice(0, 10), photoUrl: "", photoKey: "", vehicleNumber: "",
  totalAmount: 0, firstPayment: 0, secondPayment: 0, remainingAmount: 0, name: "", birth: "", phone: "", idCard: "", exam: "", category: "B", result: "ناجح", secondExamDate: "", secondResult: "", notes: "",
};

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1)).join("") || "؟"; }

const LOGO_URL = import.meta.env.BASE_URL + "icons/logo.png";

export default function Home() {
  const [session, setSession] = useState<{ user: { id: string; email?: string | null; user_metadata?: { full_name?: string } } } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>("home");
  const [viewingRecord, setViewingRecord] = useState<RecordItem | null>(null);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session as typeof session); setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession as typeof session); setAuthLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function syncRecords(showToast = false) {
    if (!supabase || !session) return;
    setSyncing(true); setLoading(true);
    const { data, error } = await supabase.from("license_records").select("*").order("id", { ascending: false }).limit(500);
    if (error) { setConnectionError("تعذر الاتصال بقاعدة البيانات"); toast.error("تعذر مزامنة السجلات مع Supabase"); }
    else {
      setConnectionError(null);
      const rows = (data ?? []) as LicenseRecordRow[];
      const items = await Promise.all(rows.map(async (row) => { const item = toLicenseRecord(row); if (supabase && item.photoKey) { const { data: signed } = await supabase.storage.from("candidate-photos").createSignedUrl(item.photoKey, 3600); if (signed?.signedUrl) return { ...item, photoUrl: signed.signedUrl }; } return item; }));
      setRecords(items);
      if (showToast) toast.success(`تمت المزامنة — ${items.length} سجل`);
    }
    setLoading(false); setSyncing(false);
  }

  useEffect(() => { if (session) void syncRecords(); else setRecords([]); }, [session?.user.id]);

  const filteredRecords = useMemo(() => { const needle = query.trim().toLowerCase(); if (!needle) return records; return records.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(needle))); }, [query, records]);
  const stats = useMemo(() => ({ total: records.length, passed: records.filter((item) => item.result === "ناجح").length, pending: records.filter((item) => item.result === "قيد المعالجة").length, failed: records.filter((item) => item.result === "راسب").length }), [records]);
  const activeSectionMeta = sectionMeta[activeSection];

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setAuthBusy(true);
    if (!isAdminUsername(authUsername)) {
      toast.error(`اسم المستخدم غير صحيح. استخدم ${ADMIN_USERNAME}`);
      setAuthBusy(false);
      return;
    }
    const result = await supabase.auth.signInWithPassword({ email: "koutoubiauto@gmail.com", password: authPassword });
    if (result.error) toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
    else { toast.success("تم تسجيل الدخول"); if (result.data.session) setSession(result.data.session as typeof session); }
    setAuthBusy(false);
  }

  function openNew() { setEditingId(null); setForm({ ...emptyForm, registrationDate: new Date().toISOString().slice(0, 10) }); setIsFormOpen(true); }
  function openEdit(item: RecordItem) { setEditingId(item.id); setForm({ ...item }); setIsFormOpen(true); }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !supabase || !session) return;
    if (!file.type.startsWith("image/")) { toast.error("اختر ملف صورة فقط"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("حجم الصورة يجب ألا يتجاوز 5 ميغابايت"); return; }
    setPhotoUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage.from("candidate-photos").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) toast.error("تعذر رفع الصورة");
    else { const { data: signed } = await supabase.storage.from("candidate-photos").createSignedUrl(path, 3600); setForm((current) => ({ ...current, photoUrl: signed?.signedUrl || "", photoKey: path })); toast.success("تم رفع صورة المترشح"); }
    setPhotoUploading(false);
  }

  async function removePhoto(item: RecordItem) {
    if (!supabase || !item.photoUrl || !window.confirm("هل تريد إزالة صورة هذا المترشح؟")) return;
    if (item.photoKey) {
      const storageResult = await supabase.storage.from("candidate-photos").remove([item.photoKey]);
      if (storageResult.error) { toast.error("تعذر إزالة الصورة من التخزين"); return; }
    }
    const result = await supabase.from("license_records").update({ photo_url: null, photo_key: null, updated_at: new Date().toISOString() }).eq("id", item.id).select().single();
    if (result.error) { toast.error("تعذر تحديث سجل الصورة"); return; }
    const updated = toLicenseRecord(result.data as LicenseRecordRow);
    setRecords((current) => current.map((record) => record.id === item.id ? updated : record));
    setViewingRecord((current) => current?.id === item.id ? updated : current);
    toast.success("تمت إزالة صورة المترشح");
  }

  function updatePayment(field: "totalAmount" | "firstPayment" | "secondPayment", value: string) { setForm((current) => { const next = { ...current, [field]: Math.max(0, Number(value) || 0) }; next.remainingAmount = calculateRemaining(next.totalAmount, next.firstPayment, next.secondPayment); return next; }); }

  async function saveRecord(event: FormEvent) {
    event.preventDefault(); if (!supabase || !session) return;
    if (!form.registrationNumber.trim() || !form.name.trim() || !form.registrationDate || !form.exam) { toast.error("يرجى إدخال رقم التسجيل والاسم وتاريخ التسجيل وتاريخ الامتحان"); return; }
    const payload = toLicensePayload(form); const result = editingId ? await supabase.from("license_records").update(payload).eq("id", editingId).select().single() : await supabase.from("license_records").insert(payload).select().single();
    if (result.error) toast.error(result.error.code === "23505" ? "رقم التسجيل مستخدم من قبل" : "تعذر حفظ البيانات");
    else { const saved = toLicenseRecord(result.data as LicenseRecordRow); setRecords((current) => editingId ? current.map((item) => item.id === editingId ? saved : item) : [saved, ...current]); setIsFormOpen(false); toast.success(editingId ? "تم تحديث بيانات المترشح" : "تم حفظ بيانات المترشح"); }
  }

  async function removeRecord(id: number) { if (!supabase || !window.confirm("هل تريد حذف هذا السجل نهائيًا؟")) return; const { error } = await supabase.from("license_records").delete().eq("id", id); if (error) toast.error("تعذر حذف السجل"); else { setRecords((current) => current.filter((item) => item.id !== id)); toast.success("تم حذف السجل"); } }

  async function logout() { if (supabase) await supabase.auth.signOut(); }
  function exportCsv() { const header = ["رقم التسجيل", "تاريخ التسجيل", "الاسم واللقب", "تاريخ الميلاد", "رقم الهاتف", "رقم بطاقة التعريف", "رقم العربة", "فئة الرخصة", "الثمن الإجمالي (درهم)", "الدفعة الأولى (درهم)", "الدفعة الثانية (درهم)", "الباقي (درهم)", "تاريخ الامتحان الأول", "النتيجة", "تاريخ الامتحان الثاني", "نتيجة الامتحان الثاني", "ملاحظات"]; const rows = records.map((item) => [item.registrationNumber, formatDisplayDate(item.registrationDate), item.name, formatDisplayDate(item.birth), item.phone, item.idCard, item.vehicleNumber, item.category, formatMoney(item.totalAmount), formatMoney(item.firstPayment), formatMoney(item.secondPayment), formatMoney(item.remainingAmount), formatDisplayDate(item.exam), item.result, formatDisplayDate(item.secondExamDate), item.secondResult, item.notes]); const csv = "\ufeff" + [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "سجل_المترشحين.csv"; anchor.click(); URL.revokeObjectURL(url); }

  if (authLoading) return <AuthLoading />;
  if (!supabaseConfigured) return <SetupScreen />;
  if (!session) return <LoginScreen username={authUsername} setUsername={setAuthUsername} password={authPassword} setPassword={setAuthPassword} busy={authBusy} onSubmit={submitAuth} />;

  return <div className="min-h-screen bg-[#f5f2eb] text-[#173840]" dir="rtl">
    <aside className="fixed inset-y-0 right-0 z-20 hidden w-[270px] flex-col bg-[#0d3943] text-white lg:flex"><div className="border-b border-white/10 px-7 py-7"><div className="flex items-center gap-3"><img src={LOGO_URL} alt="شعار المدرسة" className="h-12 w-12 rounded-xl object-cover shadow-sm" /><div><div className="font-bold">سيارة التعليم الكتبية</div><div className="mt-1 text-[11px] text-[#a9c8c5]">السجل الرقمي</div></div></div></div><div className="px-5 py-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8db4b1]">مساحة العمل</p><nav className="space-y-2"><button type="button" onClick={() => setActiveSection("home")} className={`nav-item ${isSectionActive(activeSection, "home") ? "nav-active" : ""}`}><House size={18} /> الرئيسية</button><div><button type="button" onClick={() => setActiveSection("candidates")} className={`nav-item ${isSectionActive(activeSection, "candidates") ? "nav-active" : ""}`}><Users size={18} /> المترشحون <ChevronDown size={14} className={`mr-auto transition-transform ${activeSection === "candidates" ? "rotate-180" : ""}`} /></button>{activeSection === "candidates" && <div className="mt-1 space-y-1 pr-3"><button type="button" onClick={() => setActiveSection("candidates")} className="nav-item nav-sub"><Users size={16} /> جميع المترشحين</button><button type="button" onClick={() => openNew()} className="nav-item nav-sub"><UserPlus size={16} /> إضافة مترشح</button></div>}</div><button type="button" onClick={() => setActiveSection("reports")} className={`nav-item ${isSectionActive(activeSection, "reports") ? "nav-active" : ""}`}><BarChart3 size={18} /> التقارير</button></nav></div><div className="mt-auto px-6 pb-7"><div className="rounded-2xl border border-white/20 bg-white/5 p-4"><p className="truncate text-xs font-semibold">{session.user.user_metadata?.full_name || session.user.email}</p><p className="mt-1 text-[10px] text-[#a9c8c5]">جلسة Supabase مفعّلة</p><button type="button" onClick={() => void logout()} className="mt-4 w-full rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-[#d7e8e5] transition hover:bg-white/10">تسجيل الخروج</button></div></div></aside>
    <main className="lg:mr-[270px]">{isMobileMenuOpen && <><div className="fixed inset-0 z-20 bg-[#09252b]/20 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" /><div className="fixed right-4 top-[78px] z-30 w-64 rounded-2xl border border-[#e5ded2] bg-white p-3 shadow-2xl lg:hidden"><button type="button" onClick={() => { setActiveSection("home"); setIsMobileMenuOpen(false); }} className={`nav-item w-full ${isSectionActive(activeSection, "home") ? "nav-active" : ""}`}><House size={17} /> الرئيسية</button><button type="button" onClick={() => { setActiveSection("candidates"); setIsMobileMenuOpen(false); }} className={`nav-item w-full ${isSectionActive(activeSection, "candidates") ? "nav-active" : ""}`}><Users size={17} /> المترشحون</button>{activeSection === "candidates" && <><button type="button" onClick={() => setIsMobileMenuOpen(false)} className="nav-item w-full nav-sub"><Users size={16} /> جميع المترشحين</button><button type="button" onClick={() => { setIsMobileMenuOpen(false); openNew(); }} className="nav-item w-full nav-sub"><UserPlus size={16} /> إضافة مترشح</button></>}<button type="button" onClick={() => { setActiveSection("reports"); setIsMobileMenuOpen(false); }} className={`nav-item w-full ${isSectionActive(activeSection, "reports") ? "nav-active" : ""}`}><BarChart3 size={17} /> التقارير</button></div></>}<header className="sticky top-0 z-10 border-b border-[#e5ded2] bg-[#fbfaf7]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-12"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><button type="button" onClick={() => setIsMobileMenuOpen((open) => toggleMenu(open))} className="icon-button lg:hidden" aria-label="القائمة" aria-expanded={isMobileMenuOpen}><Menu size={19} /></button><div><p className="text-[11px] font-bold tracking-[0.15em] text-[#e8793a]">{activeSectionMeta.eyebrow}</p><h1 className="mt-1 text-2xl font-bold">{activeSectionMeta.title} <span className="font-normal text-[#8c9a99]">/ {activeSectionMeta.subtitle}</span></h1></div></div><div className="flex items-center gap-2"><button type="button" onClick={() => void syncRecords(true)} disabled={syncing} className="secondary-button"><RefreshCw size={16} className={syncing ? "animate-spin" : ""} /><span className="hidden sm:inline">{syncing ? "جارٍ المزامنة" : "مزامنة البيانات"}</span></button><button type="button" onClick={openNew} className="primary-button"><Plus size={17} /> <span>حفظ مترشح</span></button></div></div></header>
      {activeSection === "reports" ? <ReportsView stats={stats} records={records} /> : activeSection === "home" ? <WelcomeView /> : <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 flex items-center gap-2 text-sm text-[#7c8d8d]"><span className={`direction-dot ${connectionError ? "offline-dot" : ""}`} />{connectionError || "متصل بقاعدة البيانات"}{connectionError && <button type="button" onClick={() => void syncRecords(true)} className="mr-3 font-bold text-[#e8793a] underline">إعادة المحاولة</button>}</p><h2 className="text-3xl font-bold tracking-tight">جميع المترشحين <span className="inline-block h-2 w-2 rounded-full bg-[#e8793a] align-middle" /></h2></div></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="إجمالي المترشحين" value={stats.total} detail="كل الملفات المسجلة" icon={Archive} tone="navy" /><StatCard label="ناجحون" value={stats.passed} detail="نتيجة الامتحان" icon={Check} tone="green" /><StatCard label="قيد المعالجة" value={stats.pending} detail="تحتاج متابعة" icon={ClipboardList} tone="orange" /><StatCard label="إعادات الامتحان" value={stats.failed} detail="ملفات راسبة" icon={UserRound} tone="sand" /></section><section className="mt-8 overflow-hidden rounded-[22px] border border-[#e4ded4] bg-white shadow-[0_12px_40px_rgba(30,60,62,0.055)]"><div className="lane-divider" /><div className="flex flex-col gap-4 border-b border-[#eee9e1] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><h3 className="text-lg font-bold">سجل المترشحين</h3><p className="mt-1 text-xs text-[#8b9998]">بيانات محفوظة ومزامنة مباشرة مع Supabase</p></div><div className="flex items-center gap-3"><div className="relative flex-1 sm:w-72"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa0a0]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو رقم التسجيل..." className="h-10 w-full rounded-xl border border-[#e6e0d7] bg-[#fbfaf7] pr-10 pl-3 text-sm outline-none focus:border-[#e8793a]" /></div><button type="button" onClick={openNew} className="icon-button" aria-label="إضافة مترشح"><Plus size={19} /></button></div></div><CandidateTable records={filteredRecords} loading={loading} openNew={openNew} removePhoto={removePhoto} setViewingRecord={setViewingRecord} openEdit={openEdit} removeRecord={removeRecord} /><div className="flex justify-between border-t border-[#eee9e1] px-7 py-4 text-xs text-[#8b9998]"><span>عرض {filteredRecords.length} من {records.length} سجلات</span><button type="button" onClick={exportCsv} className="flex items-center gap-2 font-semibold text-[#e8793a]"><FileSpreadsheet size={15} /> تنزيل نسخة Excel</button></div></section></div>}
    </main>
    {viewingRecord && <CandidateCard record={viewingRecord} close={() => setViewingRecord(null)} />}{isFormOpen && <RecordModal form={form} setForm={setForm} editingId={editingId} photoUploading={photoUploading} handlePhotoChange={handlePhotoChange} updatePayment={updatePayment} saveRecord={saveRecord} close={() => setIsFormOpen(false)} />}
  </div>;
}

function WelcomeView() {
  return <div className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center px-6 py-16 text-center">
    <div className="w-px self-stretch bg-gradient-to-b from-transparent via-[#e8793a]/40 to-transparent" />
    <img src={LOGO_URL} alt="شعار المدرسة" className="mb-8 h-28 w-28 rounded-[30px] object-cover shadow-2xl shadow-[#0d3943]/20 ring-4 ring-[#e8793a]/15" loading="lazy" decoding="async" width={112} height={112} />
    <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[#e8793a]">السجل الرقمي</p>
    <h1 className="text-5xl font-black leading-tight tracking-tight text-[#0d3943] sm:text-6xl">سيارة التعليم الكتبية</h1>
    <p className="mt-5 text-2xl font-bold text-[#e8793a] sm:text-3xl">قاعدة البيانات</p>
    <div className="lane-divider mt-8 w-72" />
    <p className="mt-8 max-w-md text-sm leading-7 text-[#7c8d8d]">منصة إدارة المترشحين والامتحانات — سجلاتك محفوظة ومزامنة مباشرة مع Supabase.</p>
  </div>;
}

function ReportsView({ stats, records }: { stats: { total: number; passed: number; pending: number; failed: number }; records: RecordItem[] }) {
  const collected = records.reduce((sum, item) => sum + item.firstPayment + item.secondPayment, 0);
  const outstanding = records.reduce((sum, item) => sum + item.remainingAmount, 0);
  const secondExamCount = records.filter((item) => item.secondExamDate).length;
  const categoryCounts = ["A", "A1", "B", "C", "D", "E"].map((category) => ({ category, count: records.filter((item) => item.category === category).length }));

  return <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10"><div className="mb-8"><p className="mb-2 text-sm text-[#7c8d8d]">قراءة سريعة لأداء السجل</p><h2 className="text-3xl font-bold tracking-tight">التقارير والمؤشرات <span className="inline-block h-2 w-2 rounded-full bg-[#e8793a] align-middle" /></h2><p className="mt-2 text-sm text-[#8b9998]">الأرقام محسوبة مباشرة من السجلات المحمّلة من Supabase.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ReportCard label="إجمالي الملفات" value={String(stats.total).padStart(2, "0")} detail="كل المترشحين المسجلين" tone="navy" /><ReportCard label="المبالغ المحصلة" value={formatMoney(collected)} detail="الدفعتان الأولى والثانية" tone="green" /><ReportCard label="المبالغ المتبقية" value={formatMoney(outstanding)} detail="بحسب الرصيد المحسوب" tone="orange" /><ReportCard label="الامتحان الثاني" value={String(secondExamCount).padStart(2, "0")} detail="ملفات لها موعد ثانٍ" tone="sand" /></section><section className="mt-8 grid gap-5 lg:grid-cols-2"><div className="rounded-[22px] border border-[#e4ded4] bg-white p-6 shadow-[0_12px_40px_rgba(30,60,62,0.055)]"><h3 className="text-lg font-bold">توزيع النتائج</h3><div className="mt-5 space-y-4"><ReportRow label="ناجحون" value={stats.passed} total={stats.total} color="bg-[#4d927c]" /><ReportRow label="قيد المعالجة" value={stats.pending} total={stats.total} color="bg-[#e8793a]" /><ReportRow label="راسبون" value={stats.failed} total={stats.total} color="bg-[#c86f62]" /></div></div><div className="rounded-[22px] border border-[#e4ded4] bg-white p-6 shadow-[0_12px_40px_rgba(30,60,62,0.055)]"><h3 className="text-lg font-bold">حسب فئة الرخصة</h3><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{categoryCounts.map((item) => <div key={item.category} className="rounded-2xl bg-[#fbfaf7] p-4"><p className="text-xs text-[#8b9998]">الفئة</p><div className="mt-2 flex items-end justify-between"><strong className="text-xl text-[#173840]">{item.category}</strong><span className="text-sm font-bold text-[#e8793a]">{item.count}</span></div></div>)}</div></div></section><ExamCalendar records={records} /></div>;
}
function ReportCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <div className={`stat-card tone-${tone}`}><div className="text-sm text-[#7c8d8d]">{label}</div><div className="mt-3 text-2xl font-black leading-tight">{value}</div><div className="mt-2 text-xs text-[#9aa7a5]">{detail}</div></div>; }
function ReportRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percentage = total ? Math.round((value / total) * 100) : 0; return <div><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-[#536d70]">{label}</span><span className="font-bold text-[#173840]">{value} ({percentage}%)</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0ed]"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div></div>; }

function LoginScreen({ username, setUsername, password, setPassword, busy, onSubmit }: { username: string; setUsername: (value: string) => void; password: string; setPassword: (value: string) => void; busy: boolean; onSubmit: (event: FormEvent) => void }) { return <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb] p-5" dir="rtl"><div className="w-full max-w-md rounded-[26px] bg-white p-8 shadow-xl"><div className="mb-8 text-center"><img src={LOGO_URL} alt="شعار المدرسة" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-md" /><h1 className="text-2xl font-bold text-[#173840]">سيارة التعليم الكتبية</h1><p className="mt-2 text-sm text-[#7c8d8d]">السجل الرقمي — دخول الإدارة</p></div><form onSubmit={onSubmit} className="space-y-4"><Field label="اسم المستخدم" value={username} onChange={setUsername} required placeholder="admin" /><Field label="كلمة المرور" type="password" value={password} onChange={setPassword} required placeholder="••••••••" /><button type="submit" className="primary-button w-full justify-center" disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"}</button></form><p className="mt-5 text-center text-xs leading-6 text-[#7c8d8d]">هذا الموقع مخصص لحساب إدارة واحد.</p></div></div>; }
function SetupScreen() { return <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb] p-6 text-center" dir="rtl"><div className="max-w-lg rounded-3xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-bold">إعداد الاتصال مطلوب</h1><p className="mt-3 text-sm text-[#6b7d7c]">أضف VITE_SUPABASE_URL وVITE_SUPABASE_PUBLISHABLE_KEY إلى أسرار GitHub ثم أعد البناء.</p></div></div>; }
function AuthLoading() { return <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb] text-[#36585d]" dir="rtl"><span className="loading-spinner ml-3" /> جارٍ التحقق من جلسة الدخول...</div>; }
function StatCard({ label, value, detail, icon: Icon, tone }: { label: string; value: number; detail: string; icon: typeof Archive; tone: string }) { return <div className={`stat-card tone-${tone}`}><div className="flex items-start justify-between"><span className="text-sm text-[#7c8d8d]">{label}</span><Icon size={18} /></div><div className="mt-3 text-3xl font-black">{String(value).padStart(2, "0")}</div><div className="mt-2 text-xs text-[#9aa7a5]">{detail}</div></div>; }
function ResultBadge({ value }: { value: string }) { return <span className={`result-badge ${value === "ناجح" ? "result-pass" : value === "راسب" ? "result-fail" : "result-pending"}`}>{value}</span>; }
function RecordModal({ form, setForm, editingId, photoUploading, handlePhotoChange, updatePayment, saveRecord, close }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; editingId: number | null; photoUploading: boolean; handlePhotoChange: (event: ChangeEvent<HTMLInputElement>) => void; updatePayment: (field: "totalAmount" | "firstPayment" | "secondPayment", value: string) => void; saveRecord: (event: FormEvent) => void; close: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09252b]/45 p-4"><form onSubmit={saveRecord} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-[#fbfaf7] shadow-2xl"><div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e9e2d8] bg-[#fbfaf7] px-6 py-5"><div><p className="text-[11px] font-bold text-[#e8793a]">{editingId ? "تعديل السجل" : "تسجيل مترشح جديد"}</p><h3 className="mt-1 text-xl font-bold">{editingId ? "تحديث بيانات المترشح" : "إضافة بيانات إلى السجل"}</h3></div><button type="button" onClick={close} className="icon-button" aria-label="إغلاق"><X size={18} /></button></div><div className="grid gap-5 px-6 py-6 sm:grid-cols-2"><div className="sm:col-span-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#e7d9cc] bg-[#fffaf5] p-5"><div className="relative">{form.photoUrl ? <img src={form.photoUrl} alt="معاينة صورة المترشح" className="h-28 w-28 rounded-2xl object-cover" loading="lazy" decoding="async" width={112} height={112} /> : <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[#e9f0ed] text-3xl font-bold text-[#5f7c7c]">{initials(form.name)}</div>}<label className="absolute -bottom-2 -left-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#e8793a] text-white" title="فتح كاميرا الهاتف" aria-label="فتح كاميرا الهاتف"><Camera size={17} /><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhotoChange} className="hidden" /></label></div><div className="flex flex-wrap items-center justify-center gap-2"><label className="secondary-button cursor-pointer text-xs"><Images size={15} /> اختيار من الملفات<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" /></label></div><p className="text-xs text-[#8b9998]">صورة المترشح — الكاميرا أو JPG/PNG/WebP (5MB)</p>{photoUploading && <p className="text-xs font-semibold text-[#e8793a]">جارٍ رفع الصورة...</p>}</div><Field label="الاسم واللقب" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="مثال: محمد بن علي" /><Field label="تاريخ الميلاد" type="date" value={form.birth} onChange={(value) => setForm({ ...form, birth: value })} /><Field label="رقم الهاتف" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="رقم بطاقة التعريف الوطنية" value={form.idCard} onChange={(value) => setForm({ ...form, idCard: value })} /><Field label="رقم التسجيل" required value={form.registrationNumber} onChange={(value) => setForm({ ...form, registrationNumber: value })} /><Field label="تاريخ التسجيل" type="date" required value={form.registrationDate} onChange={(value) => setForm({ ...form, registrationDate: value })} /><SelectField label="رقم العربة (اختياري)" value={form.vehicleNumber} options={["", "48040-د-26", "50529-د-26"]} onChange={(value) => setForm({ ...form, vehicleNumber: value as FormState["vehicleNumber"] })} /><SelectField label="فئة الرخصة" value={form.category} options={["A", "A1", "B", "C", "D", "E"]} onChange={(value) => setForm({ ...form, category: value })} /><Field label="الثمن الإجمالي (درهم)" type="number" value={String(form.totalAmount)} onChange={(value) => updatePayment("totalAmount", value)} /><Field label="الدفعة الأولى (درهم)" type="number" value={String(form.firstPayment)} onChange={(value) => updatePayment("firstPayment", value)} /><Field label="الدفعة الثانية (درهم)" type="number" value={String(form.secondPayment)} onChange={(value) => updatePayment("secondPayment", value)} /><Field label="الباقي (درهم)" type="number" value={String(form.remainingAmount)} onChange={() => undefined} /><Field label="تاريخ الامتحان الأول" type="date" required value={form.exam} onChange={(value) => setForm({ ...form, exam: value })} /><SelectField label="نتيجة الامتحان الأول" value={form.result} options={["ناجح", "راسب", "قيد المعالجة"]} onChange={(value) => setForm({ ...form, result: value as Result })} /><Field label="تاريخ الامتحان الثاني (اختياري)" type="date" value={form.secondExamDate} onChange={(value) => setForm({ ...form, secondExamDate: value })} /><SelectField label="نتيجة الامتحان الثاني (اختياري)" value={form.secondResult} options={["", "ناجح", "راسب", "قيد المعالجة"]} onChange={(value) => setForm({ ...form, secondResult: value as FormState["secondResult"] })} /><div className="sm:col-span-2"><label className="field-label">ملاحظات</label><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="field-input resize-none" /></div></div><div className="flex justify-end gap-3 border-t border-[#e9e2d8] bg-white px-6 py-4"><button type="button" onClick={close} className="secondary-button">إلغاء</button><button type="submit" disabled={photoUploading} className="primary-button"><Check size={16} /> حفظ البيانات</button></div></form></div>; }
function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) { return <label className="block"><span className="field-label">{label}{required && <b className="mr-1 text-[#e8793a]">*</b>}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="field-input" /></label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="block"><span className="field-label">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="field-input"><option value="">اختر...</option>{options.filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
