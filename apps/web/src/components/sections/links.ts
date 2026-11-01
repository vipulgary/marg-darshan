/** Booking deep links: /book-appointment?problem=<slug> preselects step 1 of the funnel. */
export const SERVICE_PROBLEM: Record<string, string> = {
  astrology: "career",
  vastu: "vastu-residential",
  gems: "gemstone",
  "birth-time": "birth-time-unknown",
};

export const bookHref = (problem?: string) =>
  problem ? `/book-appointment?problem=${encodeURIComponent(problem)}` : "/book-appointment";

export const serviceBookHref = (serviceSlug: string) => bookHref(SERVICE_PROBLEM[serviceSlug]);
