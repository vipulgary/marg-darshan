import { SETTINGS } from "@/content/catalog";
import type { Prisma } from "@/generated/prisma/client";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { SLOT_BLOCKING } from "./machine";

/** Statuses whose slot claim lapses when holdExpiresAt passes (the expiry job moves them to EXPIRED). */
export const HOLD_STATUSES: AppointmentStatus[] = ["HELD", "PENDING_PAYMENT"];
/** Statuses that block a slot regardless of the hold timer. */
export const FIRM_STATUSES: AppointmentStatus[] = SLOT_BLOCKING.filter((s) => !HOLD_STATUSES.includes(s));

export function holdExpiresAt(now: Date = new Date(), minutes: number = SETTINGS.holdMinutes): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

export function isHoldActive(
  a: { status: AppointmentStatus; holdExpiresAt: Date | string | null | undefined },
  now: Date = new Date(),
): boolean {
  if (!HOLD_STATUSES.includes(a.status) || !a.holdExpiresAt) return false;
  return new Date(a.holdExpiresAt).getTime() > now.getTime();
}

export function holdRemainingMs(expiresAt: Date | string, nowMs: number): number {
  return Math.max(0, new Date(expiresAt).getTime() - nowMs);
}

/** "09:42" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Prisma filter: appointments that currently occupy their slot. */
export function blockingAppointmentWhere(now: Date = new Date()): Prisma.AppointmentWhereInput {
  return {
    OR: [{ status: { in: FIRM_STATUSES } }, { status: { in: HOLD_STATUSES }, holdExpiresAt: { gt: now } }],
  };
}
