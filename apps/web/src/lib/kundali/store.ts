/**
 * Server-only DB access for horoscopes (used by /api/kundali/* and /kundali/[id]).
 */
import type { ChartData } from "@/lib/contracts";
import { db } from "@/lib/db";

export type KundaliStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

/**
 * Who the chart is for. BirthProfile has no name/gender columns yet, so this is
 * stored alongside the chart in chart_json (see final report: schema follow-up).
 */
export interface KundaliSubject {
  name: string;
  gender: "male" | "female" | "other";
  dob: string; // YYYY-MM-DD
  tob: string; // HH:mm
  placeName: string;
  latitude: number;
  longitude: number;
  tzName: string;
}

export type StoredChart = ChartData & { subject?: KundaliSubject };

export interface KundaliView {
  id: string;
  status: KundaliStatus;
  chartStyle: "north" | "south";
  chart: ChartData | null;
  subject: KundaliSubject;
  createdAt: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function isoDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function hhmm(d: Date | null): string {
  return d ? d.toISOString().slice(11, 16) : "";
}

export async function loadKundali(id: string): Promise<KundaliView | null> {
  if (!isUuid(id)) return null;
  const h = await db.horoscope.findUnique({
    where: { id },
    include: { birthProfile: { include: { client: { select: { fullName: true } } } } },
  });
  if (!h) return null;
  const stored = (h.chartJson ?? null) as StoredChart | null;
  const bp = h.birthProfile;
  const subject: KundaliSubject = stored?.subject ?? {
    name: bp.client?.fullName ?? "",
    gender: "other",
    dob: isoDate(bp.dob),
    tob: hhmm(bp.tob),
    placeName: bp.placeName,
    latitude: Number(bp.latitude),
    longitude: Number(bp.longitude),
    tzName: bp.tzName,
  };
  let chart: ChartData | null = null;
  if (h.status === "DONE" && stored && stored.ascendant) {
    const rest: StoredChart = { ...stored };
    delete rest.subject;
    chart = rest;
  }
  return {
    id: h.id,
    status: h.status,
    chartStyle: h.chartStyle === "south" ? "south" : "north",
    chart,
    subject,
    createdAt: h.createdAt.toISOString(),
  };
}
