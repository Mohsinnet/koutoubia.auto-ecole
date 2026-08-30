export type ActiveSection = "home" | "candidates" | "reports";

export const sectionMeta: Record<ActiveSection, { eyebrow: string; title: string; subtitle: string }> = {
  home: {
    eyebrow: "الصفحة الرئيسية",
    title: "سيارة التعليم الكتبية",
    subtitle: "قاعدة البيانات",
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
