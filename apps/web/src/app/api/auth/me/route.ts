import { db } from "@/lib/db";
import { json } from "@/lib/auth/http";
import { getCurrentClient } from "@/lib/auth/session";

const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const hhmm = (d: Date | null) => (d ? d.toISOString().slice(11, 16) : "");

/** Header avatar + form prefill: the signed-in client and their saved birth profiles. */
export async function GET() {
  const me = await getCurrentClient();
  if (!me) return json({ client: null });
  const profiles = await db.birthProfile.findMany({
    where: { clientId: me.id, label: { not: null }, isDateUnknown: false },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return json({
    client: { name: me.fullName, email: me.email, phone: me.whatsappPhone, lang: me.preferredLang, avatarUrl: me.avatarUrl },
    profiles: profiles.map((p) => ({
      id: p.id,
      label: p.label,
      name: p.fullName ?? "",
      gender: p.gender,
      dob: iso(p.dob),
      tob: p.isTimeUnknown ? "" : hhmm(p.tob),
      place: { placeName: p.placeName, latitude: Number(p.latitude), longitude: Number(p.longitude), tzName: p.tzName },
    })),
  });
}
