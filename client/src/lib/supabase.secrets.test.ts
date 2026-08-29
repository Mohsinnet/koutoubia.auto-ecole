import { describe, expect, it } from "vitest";

describe("Supabase security", () => {
  it("rejects anonymous access to license_records (RLS enforced)", async () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

    // لا توجد مفاتيح في بيئة التطوير المحلية → يُتخطى الاختبار
    if (!url || !key) return;

    // أي طلب بدون جلسة مصادقة يجب أن يُرفض من قِبل RLS (401/403)
    const response = await fetch(`${url}/rest/v1/license_records?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    expect(
      response.ok,
      `anonymous access must be blocked by RLS (got HTTP ${response.status})`,
    ).toBe(false);
  }, 15_000);
});