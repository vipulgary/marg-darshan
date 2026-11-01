import { db } from "@/lib/db";
import { csrfOk, json, readJson, str } from "@/lib/auth/http";
import { getCurrentClient } from "@/lib/auth/session";
import { normalizeIndianPhone } from "@/lib/kundali/schema";

export async function PATCH(req: Request) {
  if (!csrfOk(req)) return json({ error: "forbidden" }, 403);
  const me = await getCurrentClient();
  if (!me) return json({ error: "unauthorized" }, 401);
  const body = await readJson(req);
  if (!body) return json({ error: "invalid_json" }, 400);
  const fullName = str(body.name, 80).trim();
  const rawPhone = str(body.phone, 20).trim();
  const digits = rawPhone.replace(/\D/g, "");
  const phone = digits.length >= 10 && digits.length <= 12 ? (normalizeIndianPhone(rawPhone) ?? null) : null;
  const fields: Record<string, string> = {};
  if (fullName.length < 2) fields.name = "required";
  if (rawPhone && !phone) fields.phone = "invalid";
  if (Object.keys(fields).length) return json({ error: "validation", fields }, 400);
  await db.client.update({
    where: { id: me.id },
    data: { fullName, whatsappPhone: phone, preferredLang: body.lang === "en" ? "en" : "hi" },
  });
  return json({ ok: true });
}
