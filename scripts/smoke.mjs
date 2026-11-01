// AMX-150 smoke test: hits the running site + engine and checks every key flow end to end.
// Usage: node scripts/smoke.mjs [baseUrl]   (default http://localhost:3000; needs DB + engine running)
const BASE = process.argv[2] ?? "http://localhost:3000";
const results = [];
const json = { "Content-Type": "application/json" };

async function check(name, fn) {
  const t = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true, ms: Date.now() - t, detail: detail ?? "" });
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t, detail: e.message });
  }
}

async function req(path, init, expect = [200]) {
  const res = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(180_000), ...init });
  const body = await res.text();
  if (!expect.includes(res.status)) throw new Error(`${path} → ${res.status} ${body.slice(0, 160)}`);
  try {
    return { status: res.status, data: JSON.parse(body) };
  } catch {
    return { status: res.status, data: body };
  }
}

const PAGES = ["/", "/en", "/about-jyotish", "/en/services/vastu", "/pricing", "/contact", "/faq", "/refund-policy",
  "/shop", "/en/shop/ruby-manik", "/newsletter", "/birth-time-finder", "/free-kundali", "/book-appointment", "/sitemap.xml", "/robots.txt"];

await check(`pages (${PAGES.length})`, async () => {
  for (const p of PAGES) await req(p);
  return "all 200";
});

await check("share image", async () => {
  const r = await fetch(BASE + "/en/opengraph-image", { signal: AbortSignal.timeout(120_000) });
  if (!r.ok || !r.headers.get("content-type")?.includes("image/png")) throw new Error(`og ${r.status}`);
  return "png";
});

await check("birthplace search", async () => {
  const { data } = await req("/api/geo/search?q=Jaipur");
  if (!data[0]?.tzName) throw new Error("no results");
  return `${data[0].placeName} (${data[0].tzName})`;
});

await check("panchang", async () => {
  const { data } = await req("/api/panchang");
  return `${data.tithi?.name_en ?? "?"}, ${data.nakshatra?.name_en ?? "?"}`;
});

let slot;
await check("slots", async () => {
  // A random day 20–60 days out keeps repeated runs from colliding with earlier test holds.
  const from = new Date(Date.now() + (20 + Math.floor(Math.random() * 40)) * 864e5).toISOString().slice(0, 10);
  const { data } = await req(`/api/booking/slots?service=astrology&mode=ONLINE_ZOOM&duration=60&from=${from}&days=3`);
  slot = data.days?.flatMap((d) => d.slots).find((s) => s.available);
  if (!slot) throw new Error("no available slot");
  return slot.start;
});

const hold = (email, phone) => ({
  problemSlug: "career", serviceSlug: "astrology", mode: "ONLINE_ZOOM", durationMin: 60, slotStart: slot?.start,
  planType: "FULL_UPFRONT", contact: { name: "Smoke Test", email, phone }, gender: "male", question: "smoke test",
  birth: { dob: "1990-08-15", tob: "06:30", place: { placeName: "Jaipur, Rajasthan, India", latitude: 26.9124, longitude: 75.7873, tzName: "Asia/Kolkata" } },
  locale: "en", consent: true,
});

let appointmentId;
await check("hold slot", async () => {
  const { data } = await req("/api/booking/hold", { method: "POST", headers: json, body: JSON.stringify(hold("smoke1@example.com", "9876500001")) }, [201]);
  appointmentId = data.appointmentId;
  return `₹${data.quote.totalInr}`;
});

await check("double-booking guard", async () => {
  await req("/api/booking/hold", { method: "POST", headers: json, body: JSON.stringify(hold("smoke2@example.com", "9876500002")) }, [409]);
  return "409";
});

await check("payment page + status", async () => {
  await req(`/en/payment/${appointmentId}`);
  const { data } = await req(`/api/payments/status?appointmentId=${appointmentId}`);
  return data.appointmentStatus;
});

await check("payment order", async () => {
  const { status } = await req("/api/payments/order", { method: "POST", headers: json, body: JSON.stringify({ appointmentId, planType: "FULL_UPFRONT" }) }, [200, 503]);
  return status === 503 ? "skipped: Razorpay keys not set" : "order created";
});

await check("shop enquiry", async () => {
  const { data } = await req("/api/enquiry", { method: "POST", headers: json, body: JSON.stringify({ productSlug: "ruby-manik", name: "Smoke Test", phone: "9876500003", note: "smoke", locale: "en" }) }, [201]);
  if (!data.whatsappUrl?.startsWith("https://wa.me/")) throw new Error("no whatsapp url");
  return "wa.me link";
});

await check("newsletter", async () => {
  const { data } = await req("/api/newsletter", { method: "POST", headers: json, body: JSON.stringify({ email: `smoke+${Date.now()}@example.com`, language: "hi", website: "" }) });
  return data.status;
});

await check("free kundali", async () => {
  const body = { name: "Smoke Test", gender: "male", dob: "1990-08-15", tob: "06:30", email: "smoke-k@example.com", whatsapp: "", chartStyle: "north", lang: "en", consent: true,
    place: { placeName: "Jaipur, Rajasthan, India", latitude: 26.9124, longitude: 75.7873, tzName: "Asia/Kolkata" } };
  const { data } = await req("/api/kundali", { method: "POST", headers: json, body: JSON.stringify(body) });
  const { data: k } = await req(`/api/kundali/${data.id}`);
  if (k.status !== "DONE") throw new Error(`status ${k.status} ${k.error ?? ""}`);
  await req(`/en/kundali/${data.id}`);
  await req(`/en/kundali/${data.id}/print`);
  return `Lagna ${k.chart.ascendant.sign_en}, Moon ${k.chart.rashi.sign_en}`;
});

await check("admin guarded", async () => {
  await req("/admin", undefined, [307, 308]);
  return "redirects to login";
});

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nAstromax smoke test — ${BASE}\n`);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${pad(r.name, 24)} ${pad(r.ms + "ms", 8)} ${r.detail}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
