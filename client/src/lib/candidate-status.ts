export type CandidateStatus =
  | "ملف جديد"
  | "امتحان أول مبرمج"
  | "يحتاج إعادة"
  | "امتحان ثانٍ مبرمج"
  | "ناجح"
  | "ملف مكتمل";

export type PaymentStatus = "غير مدفوع" | "دفعة جزئية" | "مكتمل" | "غير محدد";

type CandidateLike = {
  exam: string;
  result: string;
  secondExamDate: string;
  secondResult: string;
  totalAmount: number;
  firstPayment: number;
  secondPayment: number;
  remainingAmount: number;
};

export function getCandidateStatus(item: CandidateLike): CandidateStatus {
  if (item.secondResult === "ناجح" || (item.result === "ناجح" && !item.secondExamDate)) return "ناجح";
  if (item.secondExamDate && !item.secondResult) return "امتحان ثانٍ مبرمج";
  if (item.result === "راسب") return "يحتاج إعادة";
  if (item.exam && !item.result) return "امتحان أول مبرمج";
  if (item.result === "ناجح") return "ملف مكتمل";
  return "ملف جديد";
}

export function getPaymentStatus(item: CandidateLike): PaymentStatus {
  if (item.totalAmount <= 0) return "غير محدد";
  const paid = item.firstPayment + item.secondPayment;
  if (item.remainingAmount <= 0) return "مكتمل";
  if (paid > 0) return "دفعة جزئية";
  return "غير مدفوع";
}

export function candidateStatusTone(status: CandidateStatus) {
  if (status === "ناجح" || status === "ملف مكتمل") return "success";
  if (status === "يحتاج إعادة") return "failed";
  if (status === "امتحان أول مبرمج" || status === "امتحان ثانٍ مبرمج") return "scheduled";
  return "new";
}

export function paymentStatusTone(status: PaymentStatus) {
  if (status === "مكتمل") return "success";
  if (status === "دفعة جزئية") return "partial";
  if (status === "غير مدفوع") return "failed";
  return "new";
}
