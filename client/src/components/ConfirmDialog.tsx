import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, title, message, confirmLabel = "تأكيد", busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#09252b]/45 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
    <div className="w-full max-w-sm rounded-[24px] bg-[#fbfaf7] p-6 shadow-2xl">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fbe9e6] text-[#a64e46]"><AlertTriangle size={20} /></div><h3 id="confirm-dialog-title" className="text-lg font-bold text-[#254950]">{title}</h3><button type="button" onClick={onCancel} className="icon-button mr-auto" aria-label="إغلاق" title="إغلاق"><X size={17} /></button></div>
      <p className="mt-4 text-sm leading-6 text-[#637775]">{message}</p>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="secondary-button" disabled={busy}>إلغاء</button><button type="button" onClick={onConfirm} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-[#a64e46] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#8f3f38] disabled:opacity-60">{busy ? "جارٍ التنفيذ..." : confirmLabel}</button></div>
    </div>
  </div>;
}