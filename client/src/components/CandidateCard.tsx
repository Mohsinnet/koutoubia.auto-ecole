import { CreditCard, Printer, X } from "lucide-react";
import { formatMoney } from "@/lib/payment-utils";
import { formatDisplayDate } from "@/lib/date-utils";

type CandidateCardRecord = {
  id: number;
  registrationNumber: string;
  registrationDate: string;
  photoUrl: string;
  vehicleNumber: string;
  secondExamDate: string;
  secondResult: string;
  totalAmount: number;
  firstPayment: number;
  secondPayment: number;
  remainingAmount: number;
  name: string;
  birth: string;
  phone: string;
  idCard: string;
  exam: string;
  category: string;
  result: string;
  notes: string;
};

type CandidateCardProps = { record: CandidateCardRecord; close: () => void };

function StatusBadge({ value }: { value: string }) {
  const tone = value === "ناجح" ? "bg-[#e9f0ed] text-[#276653]" : value === "راسب" ? "bg-[#fbe9e6] text-[#a64e46]" : "bg-[#fff1e8] text-[#b65d2f]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{value || "غير محدد"}</span>;
}

export default function CandidateCard({ record, close }: CandidateCardProps) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09252b]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="candidate-card-title">
    <article className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[24px] bg-[#fbfaf7] shadow-2xl">
      <header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e9e2d8] bg-[#fbfaf7] px-6 py-5">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1e8] text-[#e8793a]"><CreditCard size={21} /></div><div><p className="text-[11px] font-bold text-[#e8793a]">بطاقة المترشح</p><h2 id="candidate-card-title" className="mt-1 text-xl font-bold">{record.name}</h2></div></div>
        <button type="button" onClick={close} className="icon-button" aria-label="إغلاق بطاقة المترشح" title="إغلاق"><X size={18} /></button>
      </header>
      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[150px_1fr]">
        <div className="flex flex-col items-center gap-3"><div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl bg-[#e9f0ed] text-3xl font-bold text-[#5f7c7c]">{record.photoUrl ? <img src={record.photoUrl} alt={`صورة ${record.name}`} className="h-full w-full object-cover" loading="lazy" decoding="async" width={128} height={128} /> : record.name.trim().slice(0, 1) || "؟"}</div><p className="text-center text-xs text-[#8b9998]">رقم الملف: #{record.id}</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><Info label="رقم التسجيل" value={record.registrationNumber || "غير مسجل"} /><Info label="تاريخ التسجيل" value={formatDisplayDate(record.registrationDate)} /><Info label="رقم بطاقة التعريف" value={record.idCard || "غير مسجل"} /><Info label="رقم الهاتف" value={record.phone || "غير مسجل"} /><Info label="تاريخ الميلاد" value={formatDisplayDate(record.birth)} /><Info label="العربة / الفئة" value={`${record.vehicleNumber || "بدون عربة"} / ${record.category}`} /><Info label="الامتحان الأول" value={formatDisplayDate(record.exam)} extra={<StatusBadge value={record.result} />} /><Info label="الامتحان الثاني" value={record.secondExamDate ? formatDisplayDate(record.secondExamDate) : "غير مبرمج"} extra={record.secondResult ? <StatusBadge value={record.secondResult} /> : undefined} /></div>
      </div>
      <section className="mx-6 rounded-2xl border border-[#e9e2d8] bg-white p-5"><h3 className="font-bold text-[#254950]">ملخص المدفوعات</h3><div className="mt-4 grid gap-3 sm:grid-cols-4"><Payment label="الإجمالي" value={record.totalAmount} /><Payment label="الدفعة الأولى" value={record.firstPayment} /><Payment label="الدفعة الثانية" value={record.secondPayment} /><Payment label="الباقي" value={record.remainingAmount} accent /></div></section>
      {record.notes && <section className="mx-6 mt-4 rounded-2xl bg-[#fffaf5] p-5"><h3 className="font-bold text-[#254950]">ملاحظات</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#637775]">{record.notes}</p></section>}
      <footer className="mt-6 flex justify-end gap-3 border-t border-[#e9e2d8] bg-white px-6 py-4"><button type="button" onClick={() => window.print()} className="secondary-button"><Printer size={16} /> طباعة البطاقة</button><button type="button" onClick={close} className="primary-button">إغلاق</button></footer>
    </article>
  </div>;
}

function Info({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) { return <div className="rounded-xl bg-[#fbfaf7] p-3"><p className="text-[11px] text-[#8b9998]">{label}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#254950]">{value}{extra}</div></div>; }
function Payment({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) { return <div className="rounded-xl bg-[#fbfaf7] p-3"><p className="text-[11px] text-[#8b9998]">{label}</p><strong className={`mt-1 block text-sm ${accent ? "text-[#e8793a]" : "text-[#254950]"}`}>{formatMoney(value)}</strong></div>; }
