import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tableSource = readFileSync(new URL("../components/CandidateTable.tsx", import.meta.url), "utf8");

describe("candidate table layout", () => {
  it("keeps both organized desktop and mobile presentations", () => {
    expect(tableSource).toContain("hidden overflow-x-auto md:block");
    expect(tableSource).toContain("space-y-3 px-4 py-4 md:hidden");
    expect(tableSource).toContain('aria-label="جدول المترشحين"');
    expect(tableSource).toContain("DesktopTable");
    expect(tableSource).toContain("MobileCard");
  });

  it("keeps the candidate actions available in both presentations", () => {
    expect(tableSource).toContain("مشاهدة البطاقة");
    expect(tableSource).toContain("openEdit(item)");
    expect(tableSource).toContain("removeRecord(item.id)");
    expect(tableSource).toContain("removePhoto(item)");
  });
});
