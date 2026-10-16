import { describe, expect, it } from "vitest";
import { getCandidateStatus, getPaymentStatus } from "./candidate-status";

const base = { exam: "", result: "", secondExamDate: "", secondResult: "", totalAmount: 0, firstPayment: 0, secondPayment: 0, remainingAmount: 0 };

describe("candidate status", () => {
  it("derives the workflow state from exam information", () => {
    expect(getCandidateStatus({ ...base })).toBe("ملف جديد");
    expect(getCandidateStatus({ ...base, exam: "2026-10-20" })).toBe("امتحان أول مبرمج");
    expect(getCandidateStatus({ ...base, result: "راسب" })).toBe("يحتاج إعادة");
    expect(getCandidateStatus({ ...base, secondExamDate: "2026-10-25" })).toBe("امتحان ثانٍ مبرمج");
    expect(getCandidateStatus({ ...base, result: "ناجح" })).toBe("ناجح");
  });
});

describe("payment status", () => {
  it("distinguishes unpaid, partial, complete, and unknown balances", () => {
    expect(getPaymentStatus({ ...base })).toBe("غير محدد");
    expect(getPaymentStatus({ ...base, totalAmount: 3000, remainingAmount: 3000 })).toBe("غير مدفوع");
    expect(getPaymentStatus({ ...base, totalAmount: 3000, firstPayment: 1000, remainingAmount: 2000 })).toBe("دفعة جزئية");
    expect(getPaymentStatus({ ...base, totalAmount: 3000, firstPayment: 3000, remainingAmount: 0 })).toBe("مكتمل");
  });
});
