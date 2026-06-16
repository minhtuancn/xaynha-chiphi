import { describe, expect, test } from "vitest";
import { escapeCSV } from "@/lib/csv";
import { formatTimeInput, parseTime } from "@/lib/time";

describe("escapeCSV", () => {
  test("returns plain string unchanged", () => {
    expect(escapeCSV("hello")).toBe("hello");
    expect(escapeCSV("Ngày 16/06/2026")).toBe("Ngày 16/06/2026");
  });

  test("wraps string with comma in quotes", () => {
    expect(escapeCSV("1,000,000")).toBe('"1,000,000"');
  });

  test("escapes double quotes by doubling them", () => {
    expect(escapeCSV('say "hello"')).toBe('"say ""hello"""');
  });

  test("wraps string with newline in quotes", () => {
    expect(escapeCSV("line1\nline2")).toBe('"line1\nline2"');
  });

  test("wraps string with carriage return in quotes", () => {
    expect(escapeCSV("line1\rline2")).toBe('"line1\rline2"');
  });

  test("handles null and undefined", () => {
    expect(escapeCSV(null)).toBe("");
    expect(escapeCSV(undefined)).toBe("");
  });

  test("handles numbers", () => {
    expect(escapeCSV(1000000)).toBe("1000000");
  });
});

describe("formatTimeInput", () => {
  test("formats 7:30 as 07:30", () => {
    const d = new Date("2026-06-16T07:30:00");
    expect(formatTimeInput(d)).toBe("07:30");
  });

  test("formats 0:05 as 00:05", () => {
    const d = new Date("2026-06-16T00:05:00");
    expect(formatTimeInput(d)).toBe("00:05");
  });

  test("formats 23:59 as 23:59", () => {
    const d = new Date("2026-06-16T23:59:00");
    expect(formatTimeInput(d)).toBe("23:59");
  });

  test("pads single digit hours and minutes", () => {
    const d = new Date("2026-06-16T09:09:00");
    expect(formatTimeInput(d)).toBe("09:09");
  });
});

describe("parseTime", () => {
  test("parses 07:30 to correct Date on baseDate", () => {
    const base = new Date("2026-06-16T12:00:00");
    const result = parseTime("07:30", base);
    expect(result).toBeDefined();
    expect(result!.getHours()).toBe(7);
    expect(result!.getMinutes()).toBe(30);
  });

  test("parses 23:59 to correct Date", () => {
    const base = new Date("2026-06-16T12:00:00");
    const result = parseTime("23:59", base);
    expect(result).toBeDefined();
    expect(result!.getHours()).toBe(23);
    expect(result!.getMinutes()).toBe(59);
  });

  test("returns undefined for empty string", () => {
    expect(parseTime("", new Date())).toBeUndefined();
  });

  test("preserves baseDate year/month/day", () => {
    const base = new Date("2026-03-15T12:00:00");
    const result = parseTime("09:00", base);
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(2); // March = 2
    expect(result!.getDate()).toBe(15);
  });
});