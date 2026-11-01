import type { AppointmentStatus } from "@/generated/prisma/enums";
import { getProblem, getService, pick } from "@/content/catalog";
import { db } from "@/lib/db";
import type { StoredChart } from "@/lib/kundali/store";

/** Everything here is scoped by clientId — the only way account pages read data. */

export interface KundaliRow {
  id: string;
  name: string;
  placeName: string;
  dob: string;
  status: "QUEUED" | "RUNNING" | "DONE" | "FAILED";
  createdAt: Date;
}

export async function listKundalis(clientId: string, take = 100): Promise<KundaliRow[]> {
  const rows = await db.horoscope.findMany({
    where: { birthProfile: { clientId } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, status: true, createdAt: true, chartJson: true, birthProfile: { select: { fullName: true, placeName: true, dob: true } } },
  });
  return rows.map((h) => {
    const subject = (h.chartJson as StoredChart | null)?.subject;
    return {
      id: h.id,
      name: subject?.name ?? h.birthProfile.fullName ?? "",
      placeName: subject?.placeName ?? h.birthProfile.placeName,
      dob: subject?.dob ?? h.birthProfile.dob?.toISOString().slice(0, 10) ?? "",
      status: h.status,
      createdAt: h.createdAt,
    };
  });
}

export interface BookingRow {
  id: string;
  status: AppointmentStatus;
  serviceTitle: string;
  problemTitle: string;
  mode: "ONLINE_ZOOM" | "PERSONAL_VISIT";
  durationMin: number;
  slotStart: Date;
  slotEnd: Date;
  zoomUrl: string | null;
}

// Drafts and lapsed holds were never real bookings.
const HIDDEN: AppointmentStatus[] = ["DRAFT", "EXPIRED"];

export async function listBookings(clientId: string, locale: string): Promise<BookingRow[]> {
  const rows = await db.appointment.findMany({
    where: { clientId, status: { notIn: HIDDEN } },
    orderBy: { slotStart: "desc" },
    take: 200,
    select: {
      id: true,
      status: true,
      visitMode: true,
      durationMins: true,
      slotStart: true,
      slotEnd: true,
      zoomUrl: true,
      service: { select: { slug: true, titleHi: true, titleEn: true } },
      problem: { select: { slug: true, titleHi: true, titleEn: true } },
    },
  });
  return rows.map((a) => {
    const service = getService(a.service.slug);
    const problem = getProblem(a.problem.slug);
    return {
      id: a.id,
      status: a.status,
      serviceTitle: service ? pick(service.title, locale) : locale === "en" ? a.service.titleEn : a.service.titleHi,
      problemTitle: problem ? pick(problem.title, locale) : locale === "en" ? a.problem.titleEn : a.problem.titleHi,
      mode: a.visitMode,
      durationMin: a.durationMins,
      slotStart: a.slotStart,
      slotEnd: a.slotEnd,
      zoomUrl: a.zoomUrl,
    };
  });
}

export const UPCOMING: AppointmentStatus[] = ["HELD", "PENDING_PAYMENT", "PARTIALLY_PAID", "CONFIRMED"];

export function splitBookings(rows: BookingRow[], now = new Date()) {
  const upcoming = rows.filter((b) => UPCOMING.includes(b.status) && b.slotEnd > now).sort((a, b) => +a.slotStart - +b.slotStart);
  const past = rows.filter((b) => !upcoming.includes(b));
  return { upcoming, past };
}

export interface PaymentRow {
  id: string;
  amountInr: number;
  status: "CREATED" | "CAPTURED" | "FAILED" | "REFUNDED";
  installmentNo: number;
  createdAt: Date;
  serviceTitle: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
}

export async function listPayments(clientId: string, locale: string): Promise<PaymentRow[]> {
  const rows = await db.payment.findMany({
    where: { appointment: { clientId }, status: { in: ["CAPTURED", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      amountInr: true,
      status: true,
      installmentNo: true,
      createdAt: true,
      invoice: { select: { id: true, number: true } },
      appointment: { select: { service: { select: { slug: true, titleHi: true, titleEn: true } } } },
    },
  });
  return rows.map((p) => {
    const s = p.appointment.service;
    const service = getService(s.slug);
    return {
      id: p.id,
      amountInr: p.amountInr,
      status: p.status,
      installmentNo: p.installmentNo,
      createdAt: p.createdAt,
      serviceTitle: service ? pick(service.title, locale) : locale === "en" ? s.titleEn : s.titleHi,
      invoiceId: p.invoice?.id ?? null,
      invoiceNumber: p.invoice?.number ?? null,
    };
  });
}

export async function countProfiles(clientId: string) {
  return db.birthProfile.count({ where: { clientId, label: { not: null } } });
}

export async function listSavedProfiles(clientId: string) {
  const rows = await db.birthProfile.findMany({ where: { clientId, label: { not: null } }, orderBy: { createdAt: "asc" } });
  return rows.map((p) => ({
    id: p.id,
    label: p.label ?? "",
    name: p.fullName ?? "",
    gender: (p.gender === "male" || p.gender === "female" ? p.gender : "other") as "male" | "female" | "other",
    dob: p.dob?.toISOString().slice(0, 10) ?? "",
    tob: p.isTimeUnknown || !p.tob ? "" : p.tob.toISOString().slice(11, 16),
    place: { placeName: p.placeName, latitude: Number(p.latitude), longitude: Number(p.longitude), tzName: p.tzName },
  }));
}
