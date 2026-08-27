import { describe, expect, it } from "vitest";
import { calculateRemaining, formatMoney, toggleMenu } from "./payment-utils";

describe("payment and menu helpers", () => {
  it("calculates the remaining amount safely", () => {
    expect(calculateRemaining(50000, 20000, 15000)).toBe(15000);
    expect(calculateRemaining(50000, 30000, 25000)).toBe(0);
  });

  it("toggles the mobile menu state", () => {
    expect(toggleMenu(false)).toBe(true);
    expect(toggleMenu(true)).toBe(false);
  });

  it("formats amounts with the dirham label", () => {
    expect(formatMoney(12500)).toContain("درهم");
  });
});
