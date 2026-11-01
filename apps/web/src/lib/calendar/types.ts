import type { VisitMode } from "@/content/catalog";

export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface CreateBookingInput {
  appointmentId: string;
  serviceSlug: string;
  mode: VisitMode;
  start: Date | string;
  end?: Date | string;
  durationMin?: number;
  attendee: { name: string; email: string; phone?: string | null; locale?: string; timeZone?: string };
  notes?: string;
}

export interface CalendarProvider {
  name: "local" | "calcom";
  getBusy(from: Date, to: Date): Promise<BusyInterval[]>;
  createBooking(input: CreateBookingInput): Promise<{ uid: string; meetingUrl?: string }>;
  cancelBooking(uid: string): Promise<void>;
}

export class CalendarNotConfiguredError extends Error {
  constructor(what: string) {
    super(`calendar not configured: ${what}`);
    this.name = "CalendarNotConfiguredError";
  }
}

export class CalendarProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "CalendarProviderError";
  }
}
