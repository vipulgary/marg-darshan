import { CalComProvider } from "./calcom";
import { LocalCalendarProvider } from "./local";
import type { BusyInterval, CalendarProvider } from "./types";

export * from "./types";
export { CalComProvider, parseBookingResult, parseBusy } from "./calcom";
export { LocalCalendarProvider } from "./local";

/** CALENDAR_PROVIDER = "local" (default) | "calcom". */
export function getCalendarProvider(): CalendarProvider {
  return process.env.CALENDAR_PROVIDER === "calcom" ? new CalComProvider() : new LocalCalendarProvider();
}

/** Holds live only in our DB, so availability always merges local busy times with the external calendar's. */
export async function getBusyRanges(from: Date, to: Date): Promise<BusyInterval[]> {
  const provider = getCalendarProvider();
  const local = await new LocalCalendarProvider().getBusy(from, to);
  return provider.name === "local" ? local : [...local, ...(await provider.getBusy(from, to))];
}
