import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("sidebar button wiring", () => {
  it("changes the active section for desktop navigation", () => {
    expect(homeSource).toContain('setActiveSection("candidates")');
    expect(homeSource).toContain('setActiveSection("reports")');
    expect(homeSource).toContain('isSectionActive(activeSection, "candidates")');
    expect(homeSource).toContain('isSectionActive(activeSection, "reports")');
  });

  it("does not leave the old non-navigating placeholder messages", () => {
    expect(homeSource).not.toContain("قسم المترشحين متاح من السجل اليومي");
    expect(homeSource).not.toContain("التقارير قيد الإعداد");
  });
});
