import { describe, expect, it } from "vitest";
import { isSectionActive, sectionMeta } from "./navigation";

describe("sidebar navigation", () => {
  it("marks only the selected section as active", () => {
    expect(isSectionActive("candidates", "candidates")).toBe(true);
    expect(isSectionActive("candidates", "reports")).toBe(false);
    expect(isSectionActive("daily", "daily")).toBe(true);
  });

  it("provides visible labels for every sidebar section", () => {
    expect(sectionMeta.daily.title).toBe("السجل اليومي");
    expect(sectionMeta.candidates.title).toBe("المترشحون");
    expect(sectionMeta.reports.title).toBe("التقارير");
    expect(sectionMeta.reports.subtitle).toContain("المدفوعات");
  });
});
