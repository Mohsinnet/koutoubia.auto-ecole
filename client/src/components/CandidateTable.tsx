import { Eye, ImageOff, Pencil, Trash2, Users } from "lucide-react";
import { formatDisplayDate } from "@/lib/date-utils";
import { formatMoney } from "@/lib/payment-utils";
import { toLicenseRecord } from "@/lib/supabase";

type CandidateRecord = ReturnType<typeof toLicenseRecord>;

type CandidateTableProps = {
  records: CandidateRecord[];
  loading: boolean;
  openNew: () => void;
  removePhoto: (item: CandidateRecord) => void | Promise<void>;
  setViewingRecord: (item: CandidateRecord) => void;
  openEdit: (item: CandidateRecord) => void;
  removeRecord: (id: number) => void | Promise<void>;
};

export default function CandidateTable({ records, loading, openNew, removePhoto, setViewingRecord, openEdit, removeRecord }: CandidateTableProps) {
  return <>
    <div className="hidden overflow-x-auto md:block">
      {loading ? <LoadingState /> : records.length === 0 ? <EmptyState openNew={openNew} /> : <DesktopTable records={records} removePhoto={removePhoto} setViewingRecord={setViewingRecord} openEdit={openEdit} removeRecord={removeRecord} />}
    </div>
    <div className="space-y-3 px-4 py-4 md:hidden">
      {loading ? <LoadingState /> : records.length === 0 ? <EmptyState openNew={openNew} /> : records.map((item) => <MobileCard key={item.id} item={item} removePhoto={removePhoto} setViewingRecord={setViewingRecord} openEdit={openEdit} removeRecord={removeRecord} />)}
    </div>
  </>;
}

function LoadingState() {
  return <div className="flex items-center justify-center gap-3 py-20 text-sm text-[#7c8d8d]"><span className="loading-spinner" /> جارٍ تحميل البيانات...</div>;
}

function EmptyState({ openNew }: { openNew: () => void }) {
  return <div className="py-20 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#e8793a]"><Users size={28} /></div><p className="font-semibold text-[#36585d]">لا توجد سجلات حاليًا</p><p className="mt-1 text-sm text-[#98a7a6]">أضف أول مترشح ليظهر في الجدول.</p><button type="button" onClick={openNew} className="primary-button mx-auto mt-5">إضافة مترشح</button></div>;
}

function DesktopTable({ records, removePhoto, setViewingRecord, openEdit, removeRecord }: Omit<CandidateTableProps, "loading" | "openNew">) {
  return <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-right" aria-label="جدول المترشحين"><thead><tr className="bg-[#0d3943] text-right text-[11px] font-bold tracking-[0.08em] text-[#d7e6e3]"><th className="w-[28%] px-5 py-4 text-right">المترشح والملف</th><th className="w-[15%] px-4 py-4 text-right">العربة / الفئة</th><th className="w-[13%] px-4 py-4 text-right">التسجيل</th><th className="w-[20%] px-4 py-4 text-right">مواعيد الامتحان</th><th className="w-[16%] px-4 py-4 text-right">المدفوعات</th><th className="w-[8%] px-5 py-4 text-center">إجراء</th></tr></thead><tbody className="divide-y divide-[#f1ece4]">{records.map((item) => <DesktopRow key={item.id} item={item} removePhoto={removePhoto} setViewingRecord={setViewingRecord} openEdit={openEdit} removeRecord={removeRecord} />)}</tbody></table>;
}

function DesktopRow({ item, removePhoto, setViewingRecord, openEdit, removeRecord }: { item: CandidateRecord; removePhoto: CandidateTableProps["removePhoto"]; setViewingRecord: CandidateTableProps["setViewingRecord"]; openEdit: CandidateTableProps["openEdit"]; removeRecord: CandidateTableProps["removeRecord"] }) {
  return <tr className="group align-middle transition-colors odd:bg-[#fffdf9] even:bg-[#faf8f4] hover:bg-[#fff4e8]"><td className="px-5 py-4"><CandidateIdentity item={item} removePhoto={removePhoto} compact /></td><td className="px-4 py-4"><div className="font-semibold text-[#36585d]">{item.vehicleNumber || "بدون عربة"}</div><span className="category-chip mt-2 inline-flex">فئة {item.category}</span><div className="mt-2 text-[11px] text-[#8b9998]">{item.phone || "هاتف غير مسجل"}</div></td><td className="px-4 py-4"><div className="inline-flex flex-col items-start rounded-xl border border-[#f0e7db] bg-[#f8f5ef] px-3 py-2"><p className="text-sm font-semibold text-[#536d70]">{formatDisplayDate(item.registrationDate)}</p><p className="text-[11px] text-[#8b9998]">تاريخ التسجيل</p></div></td><td className="px-4 py-4"><div className="space-y-1.5"><ExamLine label="الأول" date={item.exam} result={item.result} /><ExamLine label="الثاني" date={item.secondExamDate} result={item.secondResult} /></div></td><td className="px-4 py-4"><PaymentSummary item={item} /></td><td className="px-5 py-4"><ActionButtons item={item} setViewingRecord={setViewingRecord} openEdit={openEdit} removeRecord={removeRecord} /></td></tr>;
}

function MobileCard({ item, removePhoto, setViewingRecord, openEdit, removeRecord }: { item: CandidateRecord; removePhoto: CandidateTableProps["removePhoto"]; setViewingRecord: CandidateTableProps["setViewingRecord"]; openEdit: CandidateTableProps["openEdit"]; removeRecord: CandidateTableProps["removeRecord"] }) {
  return <article className="rounded-2xl border border-[#e8e1d7] bg-[#fffdf9] p-4 shadow-[0_8px_24px_rgba(30,60,62,0.045)]"><div className="flex items-start justify-between gap-3"><CandidateIdentity item={item} removePhoto={removePhoto} /><span className="category-chip shrink-0">فئة {item.category}</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><InfoCell label="رقم التسجيل" value={item.registrationNumber || `#${item.id}`} /><InfoCell label="الهاتف" value={item.phone || "غير مسجل"} /><InfoCell label="العربة" value={item.vehicleNumber || "بدون عربة"} /><InfoCell label="تاريخ التسجيل" value={formatDisplayDate(item.registrationDate)} /></div><div className="mt-3 rounded-xl bg-[#f8f6f1] p-3"><p className="mb-2 text-[11px] font-bold text-[#6f8584]">مواعيد الامتحان</p><div className="grid gap-2 min-[380px]:grid-cols-2"><ExamLine label="الأول" date={item.exam} result={item.result} /><ExamLine label="الثاني" date={item.secondExamDate} result={item.secondResult} /></div></div><div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]"><MoneyCell label="الإجمالي" value={item.totalAmount} /><MoneyCell label="المدفوع" value={item.firstPayment + item.secondPayment} /><MoneyCell label="الباقي" value={item.remainingAmount} accent /></div><div className="mt-4 border-t border-[#eee9e1] pt-3"><ActionButtons item={item} setViewingRecord={setViewingRecord} openEdit={openEdit} removeRecord={removeRecord} fullWidth /></div></article>;
}

function CandidateIdentity({ item, removePhoto, compact = false }: { item: CandidateRecord; removePhoto: CandidateTableProps["removePhoto"]; compact?: boolean }) {
  return <div className="flex min-w-0 items-start gap-3"><div className={`${compact ? "h-12 w-12 rounded-xl" : "h-14 w-14 rounded-2xl"} flex shrink-0 items-center justify-center overflow-hidden bg-[#e9f0ed] text-lg font-bold text-[#5f7c7c] ring-1 ring-[#0d3943]/10`}>{item.photoUrl ? <div className="relative h-full w-full"><img src={item.photoUrl} alt={`صورة ${item.name}`} className="h-full w-full object-cover" loading="lazy" decoding="async" width={compact ? 48 : 56} height={compact ? 48 : 56} /><button type="button" onClick={() => void removePhoto(item)} className="absolute inset-x-1 bottom-1 rounded-lg bg-[#09252b]/75 px-1 py-1 text-[9px] font-bold text-white" title="إزالة الصورة"><ImageOff size={11} className="mx-auto" /></button></div> : item.name.trim().slice(0, 1) || "؟"}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#254950]">{item.name}</p><p className="mt-1 truncate text-[11px] text-[#8b9998]">رقم التسجيل: {item.registrationNumber || `#${item.id}`}</p><p className="mt-1 truncate text-[11px] text-[#a2acab]">بطاقة: {item.idCard ? `${item.idCard.slice(0, 5)}••••••` : "غير مسجلة"}</p></div></div>;
}

function ExamLine({ label, date, result }: { label: string; date: string; result: string }) {
  return <div className="flex items-center justify-between gap-2 rounded-lg bg-[#faf7f2] px-2.5 py-1.5 text-xs"><span className="font-bold text-[#536d70]">{label}</span><span className="text-[#6f8584]">{date ? formatDisplayDate(date) : "غير مبرمج"}</span>{date && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${result === "ناجح" ? "bg-[#e9f0ed] text-[#276653]" : result === "راسب" ? "bg-[#fbe9e6] text-[#a64e46]" : "bg-[#fff1e8] text-[#b65d2f]"}`}>{result || "غير محدد"}</span>}</div>;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f8f6f1] p-2.5"><p className="text-[10px] text-[#8b9998]">{label}</p><p className="mt-1 truncate text-xs font-bold text-[#36585d]">{value}</p></div>;
}

function MoneyCell({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className="rounded-xl bg-[#f8f6f1] p-2"><p className="text-[10px] text-[#8b9998]">{label}</p><p className={`mt-1 text-xs font-bold ${accent ? "text-[#e8793a]" : "text-[#36585d]"}`}>{formatMoney(value)}</p></div>;
}

function PaymentSummary({ item }: { item: CandidateRecord }) {
  return <div className="rounded-xl border border-[#f0e7db] bg-[#fbf8f3] px-3 py-2"><div className="flex justify-between gap-3 text-xs"><span className="text-[#8b9998]">الإجمالي</span><strong className="text-[#36585d]">{formatMoney(item.totalAmount)}</strong></div><div className="mt-1 flex justify-between gap-3 text-xs"><span className="text-[#8b9998]">المدفوع</span><strong className="text-[#36585d]">{formatMoney(item.firstPayment + item.secondPayment)}</strong></div><div className="mt-1.5 flex items-center justify-between gap-3 border-t border-dashed border-[#e8ddd0] pt-1.5"><span className="text-xs text-[#8b9998]">الباقي</span><strong className="rounded-full bg-[#fff1e6] px-2.5 py-0.5 text-xs font-bold text-[#b65d2f]">{formatMoney(item.remainingAmount)}</strong></div></div>;
}

function ActionButtons({ item, setViewingRecord, openEdit, removeRecord, fullWidth = false }: { item: CandidateRecord; setViewingRecord: CandidateTableProps["setViewingRecord"]; openEdit: CandidateTableProps["openEdit"]; removeRecord: CandidateTableProps["removeRecord"]; fullWidth?: boolean }) {
  return <div className={fullWidth ? "grid grid-cols-3 gap-2" : "flex items-center justify-center gap-1"}><button type="button" onClick={() => setViewingRecord(item)} className={fullWidth ? "table-action flex w-full items-center justify-center gap-1" : "table-action"} aria-label="مشاهدة البطاقة" title="مشاهدة البطاقة"><Eye size={15} />{fullWidth && <span className="text-[11px]">البطاقة</span>}</button><button type="button" onClick={() => openEdit(item)} className={fullWidth ? "table-action flex w-full items-center justify-center gap-1" : "table-action"} aria-label="تعديل" title="تعديل"><Pencil size={15} />{fullWidth && <span className="text-[11px]">تعديل</span>}</button><button type="button" onClick={() => void removeRecord(item.id)} className={fullWidth ? "table-action danger flex w-full items-center justify-center gap-1" : "table-action danger"} aria-label="حذف" title="حذف"><Trash2 size={15} />{fullWidth && <span className="text-[11px]">حذف</span>}</button></div>;
}
