import { describe, expect, it } from "vitest";
import { getAuthRedirectUrl } from "./auth-url";

describe("getAuthRedirectUrl", () => {
  it("resolves the repository base path against the deployed origin", () => {
    expect(getAuthRedirectUrl("https://mohsinnet.github.io", "/koutoubia.auto-ecole/")).toBe(
      "https://mohsinnet.github.io/koutoubia.auto-ecole/",
    );
  });

  it("keeps the root path for local development", () => {
    expect(getAuthRedirectUrl("http://localhost:3000", "/")).toBe("http://localhost:3000/");
  });
});
