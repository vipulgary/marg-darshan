import { randomUUID } from "node:crypto";
import { blockingAppointmentWhere } from "@/lib/booking/hold";
import { type BusyInterval, CalendarNotConfiguredError, type CalendarProvider } from "./types";

/** Availability straight from our own appointments table (default provider). */
export class LocalCalendarProvider implements CalendarProvider {
  readonly name = "local" as const;

  async getBusy(from: Date, to: Date): Promise<BusyInterval[]> {
    if (!process.env.DATABASE_URL) throw new CalendarNotConfiguredError("DATABASE_URL");
    const { db } = await import("@/lib/db");
    const rows = await db.appointment.findMany({
      where: { AND: [blockingAppointmentWhere(new Date()), { slotStart: { lt: to } }, { slotEnd: { gt: from } }] },
      select: { slotStart: true, slotEnd: true },
    });
    return rows.map((r) => ({ start: r.slotStart, end: r.slotEnd }));
  }

  async createBooking(input: { appointmentId: string }) {
    // Meeting links for local bookings come from the Zoom integration / admin, not from here.
    return { uid: `local-${input.appointmentId || randomUUID()}`, meetingUrl: process.env.DEFAULT_MEETING_URL || undefined };
  }

  async cancelBooking(): Promise<void> {}
}
