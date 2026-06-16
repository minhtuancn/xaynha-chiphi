import { describe, expect, test } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatDateInput,
  formatUnit,
  formatPercent,
  formatFileSize,
} from "@/lib/utils";

describe("formatCurrency", () => {
  test("formats whole number", () => {
    expect(formatCurrency(1000000)).toContain("1.000.000");
  });

  test("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  test("handles string input", () => {
    expect(formatCurrency("500000")).toContain("500.000");
  });

  test("handles NaN", () => {
    expect(formatCurrency(NaN)).toBe("0 ₫");
  });

  test("formats negative", () => {
    expect(formatCurrency(-500000)).toContain("-");
  });

  test("includes VND symbol", () => {
    expect(formatCurrency(1000)).toContain("₫");
  });
});

describe("formatNumber", () => {
  test("formats with default 2 decimals", () => {
    const result = formatNumber(1234.567);
    expect(result).toMatch(/1\.234/);
    expect(result).toMatch(/57$/);
  });

  test("formats with 0 decimals", () => {
    expect(formatNumber(1234.9, 0)).toBe("1.235");
  });

  test("handles NaN", () => {
    expect(formatNumber(NaN)).toBe("0");
  });
});

describe("formatDate", () => {
  test("formats Date object in vi-VN", () => {
    const d = new Date("2026-06-16");
    const result = formatDate(d);
    expect(result).toMatch(/16/);
    expect(result).toMatch(/06/);
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/\//);
  });

  test("formats ISO string", () => {
    const result = formatDate("2026-06-16");
    expect(result).toMatch(/16/);
    expect(result).toMatch(/06/);
  });

  test("returns dash for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  test("returns dash for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatDateTime", () => {
  test("formats Date with time in vi-VN", () => {
    const d = new Date("2026-06-16T14:30:00");
    const result = formatDateTime(d);
    expect(result).toMatch(/16/);
    expect(result).toMatch(/14/);
    expect(result).toMatch(/30/);
  });

  test("returns dash for null", () => {
    expect(formatDateTime(null)).toBe("-");
  });

  test("returns dash for invalid date", () => {
    expect(formatDateTime("")).toBe("-");
  });
});

describe("formatDateInput", () => {
  test("formats Date to YYYY-MM-DD", () => {
    const d = new Date("2026-06-16T14:30:00");
    expect(formatDateInput(d)).toBe("2026-06-16");
  });

  test("formats ISO string to YYYY-MM-DD", () => {
    expect(formatDateInput("2026-06-16")).toBe("2026-06-16");
  });

  test("returns empty string for null", () => {
    expect(formatDateInput(null)).toBe("");
  });

  test("returns empty string for invalid date", () => {
    expect(formatDateInput("")).toBe("");
  });
});

describe("formatUnit", () => {
  test("uses known unit label", () => {
    expect(formatUnit(10, "m2")).toBe("10 m²");
    expect(formatUnit(5, "kg")).toBe("5 kg");
  });

  test("uses raw unit when unknown", () => {
    expect(formatUnit(3, "customunit")).toBe("3 customunit");
  });

  test("rounds to 0 decimals", () => {
    expect(formatUnit(10.7, "m2")).toBe("11 m²");
  });
});

describe("formatPercent", () => {
  test("rounds and appends percent sign", () => {
    expect(formatPercent(75.6)).toBe("76%");
  });

  test("handles 0", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  test("handles 100", () => {
    expect(formatPercent(100)).toBe("100%");
  });
});

describe("formatFileSize", () => {
  test("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  test("formats KB", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  test("formats MB", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
  });

  test("formats GB", () => {
    expect(formatFileSize(1024 * 1024 * 512)).toBe("512 MB");
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });
});