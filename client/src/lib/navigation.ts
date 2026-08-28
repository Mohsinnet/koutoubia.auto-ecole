export type ActiveSection = "daily" | "candidates" | "reports";

export const sectionMeta: Record<ActiveSection, { eyebrow: string; title: string; subtitle: string }> = {
  daily: {
    eyebrow: "لوحة متابعة المترشحين",
    title: "السجل اليومي",
    subtitle: "إدارة البيانات",
  },
  candidates: {
    eyebrow: "إدارة الملفات",
    title: "المترشحون",
    subtitle: "كل الملفات المسجلة",
  },
  reports: {
    eyebrow: "مؤشرات العمل",
    title: "التقارير",
    subtitle: "ملخص الأداء والمدفوعات",
  },
};

export function isSectionActive(current: ActiveSection, target: ActiveSection) {
  return current === target;
}
