import { describe, expect, it } from "vitest";
import { ADMIN_USERNAME, isAdminUsername } from "./admin-auth";

describe("admin authentication", () => {
  it("accepts the configured admin username case-insensitively", () => {
    expect(isAdminUsername(ADMIN_USERNAME)).toBe(true);
    expect(isAdminUsername(" ADMIN ")).toBe(true);
  });

  it("rejects other usernames", () => {
    expect(isAdminUsername("koutoubia")).toBe(false);
    expect(isAdminUsername("")).toBe(false);
  });
});
