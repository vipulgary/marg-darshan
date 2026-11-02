import type { Prisma } from "@/generated/prisma/client";
import type { BirthInput, ChartData } from "@/lib/contracts";
import { db } from "@/lib/db";
import { computeHoroscope, isEngineConfigured } from "@/lib/engine/client";
import { normalizedInputHash } from "@/lib/kundali/hash";
import type { KundaliSubject, StoredChart } from "@/lib/kundali/store";
import { listSavedProfiles } from "./queries";

export type SavedProfile = Awaited<ReturnType<typeof listSavedProfiles>>[number];

const SELF = /^(self|me|myself|my\s*self|स्वयं|खुद|ख़ुद|मैं|मेरा|मेरी)$/i;

/** The profile the dashboard opens on: the requested one, else "Self", else the first saved. */
export function pickProfile(profiles: SavedProfile[], requested?: string | null): SavedProfile | null {
  return profiles.find((p) => p.id === requested) ?? profiles.find((p) => SELF.test(p.label.trim())) ?? profiles[0] ?? null;
}

/**
 * Every saved profile gets its kundali automatically: reuse the latest finished chart for that
 * profile, or compute one now. Returns null when the engine is unavailable or the chart fails.
 */
export async function ensureProfileKundali(
  clientId: string,
  p: SavedProfile,
  lang: "hi" | "en",
): Promise<{ id: string; chart: ChartData } | null> {
  const existing = await db.horoscope.findFirst({
    where: { birthProfileId: p.id, status: "DONE", birthProfile: { clientId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, chartJson: true },
  });
  const stored = existing?.chartJson as StoredChart | null | undefined;
  // Recompute charts saved before AMX-200 (no Sade Sati periods) or before calc_version 3 (Lahiri fix + upcoming dates).
  if (existing && stored?.ascendant && stored.sade_sati_periods && (stored.calc_version ?? 0) >= 3) return { id: existing.id, chart: stored };

  if (!isEngineConfigured() || !p.dob) return null;
  // Unknown birth time: noon is the conventional stand-in; the Lagna is then approximate.
  const input: BirthInput = { name: p.name || p.label, gender: p.gender, dob: p.dob, tob: p.tob || "12:00", place: p.place, lang };
  const subject: KundaliSubject = {
    name: input.name,
    gender: input.gender,
    dob: input.dob,
    tob: input.tob,
    placeName: p.place.placeName,
    latitude: p.place.latitude,
    longitude: p.place.longitude,
    tzName: p.place.tzName,
  };
  try {
    const { vargas, ...chart } = await computeHoroscope(input);
    const data = {
      inputHash: normalizedInputHash(input),
      lang,
      chartStyle: "north" as const,
      status: "DONE" as const,
      chartJson: { ...chart, subject } as unknown as Prisma.InputJsonValue,
      vargasJson: vargas ? (vargas as unknown as Prisma.InputJsonValue) : undefined,
      yogasDoshas: chart.yogas_doshas ? (chart.yogas_doshas as unknown as Prisma.InputJsonValue) : undefined,
    };
    // An outdated chart for this profile is refreshed in place, never duplicated.
    const row = existing
      ? await db.horoscope.update({ where: { id: existing.id }, data, select: { id: true } })
      : await db.horoscope.create({ data: { birthProfileId: p.id, ...data }, select: { id: true } });
    return { id: row.id, chart };
  } catch (e) {
    console.error("[account] profile kundali failed", e);
    return null;
  }
}
