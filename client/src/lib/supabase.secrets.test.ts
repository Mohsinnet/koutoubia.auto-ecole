import { describe, expect, it } from "vitest";

describe("Supabase deployment secrets", () => {
  it("can reach license_records with the configured publishable key", async () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

    expect(url, "VITE_SUPABASE_URL is required").toBeTruthy();
    expect(key, "VITE_SUPABASE_PUBLISHABLE_KEY is required").toBeTruthy();

    const response = await fetch(`${url}/rest/v1/license_records?select=id&limit=1`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key}`,
      },
    });

    expect(response.ok, `Supabase returned HTTP ${response.status}`).toBe(true);
  }, 15_000);
});
