import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import {
  type BusinessSettings,
  SETTING_KEYS,
  type SettingKey,
  type SettingRow,
  defaultSettings,
  mergeSettings,
  serviceLookup,
} from "./schema";

export * from "./schema";

/** Cache tag for the settings rows; the admin save action expires it. */
export const SETTINGS_TAG = "business-settings";
const DB_TIMEOUT_MS = 3_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`settings query timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function readRows(): Promise<SettingRow[]> {
  const { db } = await import("@/lib/db");
  const rows = await withTimeout(db.setting.findMany({ select: { key: true, value: true } }), DB_TIMEOUT_MS);
  return rows.map((r) => ({ key: r.key, value: r.value }));
}

// Throws on DB failure so an outage is never cached; getSettings() falls back per call instead.
const cachedRows = unstable_cache(readRows, ["business-settings-rows"], { tags: [SETTINGS_TAG], revalidate: 300 });

/**
 * Effective business settings: DB rows merged over catalog defaults. Never throws — with no
 * DATABASE_URL, a DB error or a timeout the site keeps running on the catalog values.
 */
export async function getSettings(): Promise<BusinessSettings> {
  const defaults = defaultSettings();
  if (!process.env.DATABASE_URL) return defaults;
  try {
    const { settings, invalid } = mergeSettings(defaults, await cachedRows());
    if (invalid.length) console.warn(`[settings] ignoring invalid stored values: ${invalid.join(", ")}`);
    return settings;
  } catch (e) {
    console.error("[settings] falling back to catalog defaults", e);
    return defaults;
  }
}

/** Server-side price source for quotes (booking hold + payments). */
export async function getServiceLookup() {
  return serviceLookup(await getSettings());
}

export async function getWhatsAppNumber(): Promise<string> {
  return (await getSettings()).whatsappNumber;
}

export type SettingsSource = "db" | "defaults" | "not_configured" | "error";

export interface AdminSettingsView {
  settings: BusinessSettings;
  source: SettingsSource;
  invalid: string[];
  lastUpdated: { at: string; by: string | null } | null;
}

/** Uncached read for the admin page, with where the values came from. */
export async function loadSettingsForAdmin(): Promise<AdminSettingsView> {
  const defaults = defaultSettings();
  if (!process.env.DATABASE_URL) return { settings: defaults, source: "not_configured", invalid: [], lastUpdated: null };
  try {
    const { db } = await import("@/lib/db");
    const rows = await withTimeout(db.setting.findMany(), DB_TIMEOUT_MS);
    const { settings, invalid } = mergeSettings(defaults, rows);
    const latest = rows.reduce<(typeof rows)[number] | null>((a, r) => (!a || r.updatedAt > a.updatedAt ? r : a), null);
    return {
      settings,
      source: rows.length ? "db" : "defaults",
      invalid,
      lastUpdated: latest ? { at: latest.updatedAt.toISOString(), by: latest.updatedBy } : null,
    };
  } catch (e) {
    console.error("[settings] admin load failed", e);
    return { settings: defaults, source: "error", invalid: [], lastUpdated: null };
  }
}

export class SettingsUnavailableError extends Error {
  constructor(message = "Settings can't be saved: DATABASE_URL is not configured") {
    super(message);
    this.name = "SettingsUnavailableError";
  }
}

/** Upserts every key (callers pass fully validated settings). Cache invalidation is the caller's job. */
export async function saveSettings(value: BusinessSettings, updatedBy: string): Promise<void> {
  if (!process.env.DATABASE_URL) throw new SettingsUnavailableError();
  const { db } = await import("@/lib/db");
  await db.$transaction(
    SETTING_KEYS.map((key: SettingKey) => {
      const json = value[key] as Prisma.InputJsonValue;
      return db.setting.upsert({ where: { key }, create: { key, value: json, updatedBy }, update: { value: json, updatedBy } });
    }),
  );
}
