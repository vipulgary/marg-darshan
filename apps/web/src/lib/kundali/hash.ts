import { createHash } from "node:crypto";
import type { BirthInput } from "@/lib/contracts";

/** "9:5", "09:05" and "09:05:00" all become "09:05". */
export function normalizeTob(tob: string): string {
  const [h = "0", m = "0"] = tob.trim().split(":");
  return `${String(Number(h)).padStart(2, "0")}:${String(Number(m)).padStart(2, "0")}`;
}

function fixed4(n: number): string {
  const s = n.toFixed(4);
  return s === "-0.0000" ? "0.0000" : s;
}

/**
 * Cache key for a computed chart. The chart depends only on the birth moment and
 * place, so name, gender and language are deliberately left out.
 */
export function normalizedInputHash(input: BirthInput): string {
  const canonical = [
    "v1",
    input.dob.trim(),
    normalizeTob(input.tob),
    fixed4(input.place.latitude),
    fixed4(input.place.longitude),
    input.place.tzName.trim(),
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}
