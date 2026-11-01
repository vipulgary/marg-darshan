/**
 * RFC 4180 CSV with spreadsheet formula-injection protection (cells starting with
 * = + - @ tab or CR are prefixed with an apostrophe). Prepends a UTF-8 BOM so Excel
 * shows Devanagari correctly.
 */
export type CsvValue = string | number | boolean | Date | null | undefined;

export function csvCell(v: CsvValue): string {
  if (v === null || v === undefined) return "";
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
