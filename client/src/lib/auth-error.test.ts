import { describe, expect, it } from "vitest";
import { formatAuthError } from "./auth-error";

describe("formatAuthError", () => {
  it("explains that the email must be confirmed", () => {
    expect(formatAuthError("Email not confirmed")).toContain("غير مؤكد");
  });

  it("keeps invalid credentials understandable in Arabic", () => {
    expect(formatAuthError("Invalid login credentials")).toBe("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  });

  it("preserves unexpected provider messages for diagnosis", () => {
    expect(formatAuthError("Unsupported provider")).toBe("Unsupported provider");
  });
});
