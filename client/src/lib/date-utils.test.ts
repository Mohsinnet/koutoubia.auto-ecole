import { describe, expect, it } from "vitest";
import { formatDisplayDate } from "./date-utils";

describe("formatDisplayDate", () => {
  it("formats ISO dates as day/month/year", () => {
    expect(formatDisplayDate("2026-08-28")).toBe("28/08/2026");
  });

  it("keeps empty and non-ISO values safe", () => {
    expect(formatDisplayDate("")).toBe("—");
    expect(formatDisplayDate("28/08/2026")).toBe("28/08/2026");
  });
});
