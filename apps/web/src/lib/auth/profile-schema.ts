import { z } from "zod";
import { placeSchema } from "@/lib/kundali/schema";

/** Saved birth profile ("Self", "Mother" …) managed from /account/profiles. */
export const savedProfileSchema = z.object({
  label: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(80),
  gender: z.enum(["male", "female", "other"]),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.getUTCFullYear() >= 1900 && d.getTime() <= Date.now();
  }),
  tob: z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]),
  place: placeSchema,
});

export type SavedProfileInput = z.infer<typeof savedProfileSchema>;

export function profileData(p: SavedProfileInput) {
  return {
    label: p.label,
    fullName: p.name,
    gender: p.gender,
    dob: new Date(`${p.dob}T00:00:00Z`),
    tob: p.tob ? new Date(`1970-01-01T${p.tob}:00Z`) : null,
    isTimeUnknown: !p.tob,
    placeName: p.place.placeName,
    latitude: p.place.latitude,
    longitude: p.place.longitude,
    tzName: p.place.tzName,
  };
}
