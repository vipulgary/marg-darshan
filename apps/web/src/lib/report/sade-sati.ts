/**
 * AMX-200 — Sade Sati & small Panoti timeline from the engine's real Saturn transits
 * (chart.sade_sati_periods: one row per stretch, retrograde back-and-forth included).
 */

export type SadeSatiKind = "sade_sati" | "small_panoti";
export type SadeSatiPhase = "rising" | "peak" | "setting" | "4th" | "8th";

export interface SadeSatiRow {
  kind: SadeSatiKind;
  phase: SadeSatiPhase;
  saturn_sign: number;
  start: string; // YYYY-MM-DD
  end: string;
}

export interface SadeSatiCycle {
  status: SadeSatiKind | "free";
  /** The row in force today (null when free). */
  current: SadeSatiRow | null;
  /** When the whole current stretch (incl. retrograde returns) is finally over. */
  currentEnd: string | null;
  /** The calm gap after the current stretch, or today's free gap: from → until the next row. */
  freeFrom: string | null;
  freeUntil: string | null;
  /** The next Sade Sati to begin after today (null if one is running). */
  nextSadeSati: SadeSatiRow | null;
  /** Rows from the start of the current/last stretch onward, for the table. */
  rows: SadeSatiRow[];
}

const GAP_DAYS = 400; // a retrograde return within ~13 months belongs to the same stretch
const days = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 864e5;
const nextDay = (iso: string) => new Date(Date.parse(iso) + 864e5).toISOString().slice(0, 10);

/** Groups rows into stretches of the same kind (retrograde returns stay in one stretch). */
function stretches(rows: SadeSatiRow[]): SadeSatiRow[][] {
  const out: SadeSatiRow[][] = [];
  for (const r of rows) {
    const last = out.at(-1);
    const prev = last?.at(-1);
    if (last && prev && prev.kind === r.kind && days(prev.end, r.start) < GAP_DAYS) last.push(r);
    else out.push([r]);
  }
  return out;
}

export function sadeSatiTimeline(rows: SadeSatiRow[] | undefined, today: string): SadeSatiCycle | null {
  if (!rows?.length) return null;
  const groups = stretches(rows);
  const gi = groups.findIndex((g) => g[0].start <= today && today <= g.at(-1)!.end);
  const current = rows.find((r) => r.start <= today && today <= r.end) ?? null;
  const active = gi >= 0 ? groups[gi] : null;
  const following = groups.find((g) => g[0].start > today) ?? null;
  const currentEnd = active ? active.at(-1)!.end : null;
  const afterActive = gi >= 0 ? groups[gi + 1] ?? null : following;
  const lastPast = [...groups].reverse().find((g) => g.at(-1)!.end < today) ?? null;

  return {
    status: active ? active[0].kind : "free",
    current,
    currentEnd,
    freeFrom: active ? nextDay(currentEnd!) : lastPast ? nextDay(lastPast.at(-1)!.end) : null,
    freeUntil: afterActive ? afterActive[0].start : null,
    nextSadeSati: active?.[0].kind === "sade_sati" ? null : rows.find((r) => r.kind === "sade_sati" && r.start > today) ?? null,
    rows: rows.filter((r) => r.end >= (active ?? lastPast ?? groups[0])[0].start),
  };
}
