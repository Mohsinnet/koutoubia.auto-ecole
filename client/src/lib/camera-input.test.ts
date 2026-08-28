import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("mobile camera input", () => {
  it("requests the rear-facing camera for the capture control", () => {
    expect(homeSource).toContain('title="فتح كاميرا الهاتف"');
    expect(homeSource).toContain('capture="environment"');
    expect(homeSource).toContain('accept="image/jpeg,image/png,image/webp"');
  });

  it("keeps a separate file-picker control", () => {
    expect(homeSource).toContain("اختيار من الملفات");
    expect(homeSource).toContain("<Images size={15} />");
  });
});
