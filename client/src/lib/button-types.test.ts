import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
const buttonTags = [...homeSource.matchAll(/<button\b[^>]*>/g)].map(([tag]) => tag);

describe("Home button semantics", () => {
  it("gives every button an explicit type", () => {
    expect(buttonTags.length).toBeGreaterThan(0);
    expect(buttonTags.every((tag) => /\btype\s*=/.test(tag))).toBe(true);
  });

  it("keeps explicit submit buttons for the two forms", () => {
    expect(buttonTags.filter((tag) => /type=[\"']submit[\"']/.test(tag)).length).toBe(2);
  });
});
