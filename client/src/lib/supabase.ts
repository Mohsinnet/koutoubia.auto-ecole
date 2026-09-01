import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LicenseRecordRow = {
  id: number;
  registration_number: string | null;
  registration_date: string;
  photo_url: string | null;
  photo_key: string | null;
  vehicle_number: "48040-د-26" | "50529-د-26" | null;
  second_exam_date: string | null;
  second_result: "ناجح" | "راسب" | "قيد المعالجة" | null;
  total_amount: number;
  first_payment: number;
  second_payment: number;
  remaining_amount: number;
  name: string;
  birth_date: string | null;
  phone: string | null;
  id_card: string | null;
  exam_date: string | null;
  category: string;
  result: "ناجح" | "راسب" | "قيد المعالجة";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// These are public Supabase client values injected at build time (GitHub Actions secrets).
// RLS and Auth policies remain the security boundary.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const supabaseConfigured = Boolean(supabase);

export type LicenseRecordForm = { registrationNumber: string; registrationDate: string; photoUrl?: string; photoKey?: string; vehicleNumber: "" | "48040-د-26" | "50529-د-26"; totalAmount: number; firstPayment: number; secondPayment: number; remainingAmount: number; name: string; birth: string; phone: string; idCard: string; exam: string; category: string; result: LicenseRecordRow["result"] | ""; secondExamDate: string; secondResult: LicenseRecordRow["result"] | ""; notes: string };

export function toLicensePayload(form: LicenseRecordForm) {
  return { registration_number: form.registrationNumber.trim() || null, registration_date: form.registrationDate, name: form.name.trim(), birth_date: form.birth || null, phone: form.phone || null, id_card: form.idCard || null, exam_date: form.exam || null, category: form.category || "B", result: form.result || null, second_exam_date: form.secondExamDate || null, second_result: form.secondResult || null, vehicle_number: form.vehicleNumber || null, total_amount: form.totalAmount, first_payment: form.firstPayment, second_payment: form.secondPayment, remaining_amount: Math.max(0, form.totalAmount - form.firstPayment - form.secondPayment), notes: form.notes || null, photo_url: form.photoUrl || null, photo_key: form.photoKey || null, updated_at: new Date().toISOString() };
}

export function toLicenseRecord(row: LicenseRecordRow) {
  return {
    id: Number(row.id),
    registrationNumber: row.registration_number ?? "",
    registrationDate: row.registration_date ?? "",
    photoUrl: row.photo_url ?? "",
    photoKey: row.photo_key ?? "",
    vehicleNumber: row.vehicle_number ?? "",
    secondExamDate: row.second_exam_date ?? "",
    secondResult: row.second_result ?? "",
    totalAmount: Number(row.total_amount ?? 0),
    firstPayment: Number(row.first_payment ?? 0),
    secondPayment: Number(row.second_payment ?? 0),
    remainingAmount: Number(row.remaining_amount ?? 0),
    name: row.name,
    birth: row.birth_date ?? "",
    phone: row.phone ?? "",
    idCard: row.id_card ?? "",
    exam: row.exam_date ?? "",
    category: row.category,
    result: row.result ?? "",
    notes: row.notes ?? "",
  } as const;
}
