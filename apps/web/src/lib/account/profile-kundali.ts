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
  // Charts saved before AMX-200 lack the real Sade Sati periods: recompute those once.
  if (existing && stored?.ascendant && stored.sade_sati_periods) return { id: existing.id, chart: stored };

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
    const row = await db.horoscope.create({
      data: {
        birthProfileId: p.id,
        inputHash: normalizedInputHash(input),
        lang,
        chartStyle: "north",
        status: "DONE",
        chartJson: { ...chart, subject } as unknown as Prisma.InputJsonValue,
        vargasJson: vargas ? (vargas as unknown as Prisma.InputJsonValue) : undefined,
        yogasDoshas: chart.yogas_doshas ? (chart.yogas_doshas as unknown as Prisma.InputJsonValue) : undefined,
      },
      select: { id: true },
    });
    return { id: row.id, chart };
  } catch (e) {
    console.error("[account] profile kundali failed", e);
    return null;
  }
}
