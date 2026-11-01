import { NextResponse } from "next/server";
import { getProblem, getProduct, pick } from "@/content/catalog";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { enquirySchema } from "@/lib/shop/enquiry";
import { normalizeIndianMobile } from "@/lib/shop/phone";
import { getWhatsAppNumber } from "@/lib/settings";
import { buildWhatsAppUrl, whatsappMessage } from "@/lib/whatsapp";

const HOUR_MS = 60 * 60 * 1000;

const fail = (status: number, error: string, message: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, message, ...extra }, { status });

/** AMX-112 — save the shop lead first, then hand back a SKU-prefilled wa.me link. */
export async function POST(req: Request) {
  const rl = rateLimit(`enquiry:${clientIp(req)}`, 10, HOUR_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many enquiries, try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail(400, "invalid_json", "Request body must be JSON.");
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "invalid", "Invalid enquiry.", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const { productSlug, name, phone, note, problemSlug, locale } = parsed.data;
  if (!getProduct(productSlug)) return fail(400, "unknown_product", "Unknown product.");
  if (!process.env.DATABASE_URL) return fail(503, "db_unavailable", "Database is not configured.");

  const whatsappPhone = normalizeIndianMobile(phone)!;
  try {
    const product = await db.product.findUnique({
      where: { slug: productSlug },
      select: { id: true, sku: true, titleHi: true, titleEn: true, active: true },
    });
    if (!product || !product.active) {
      return fail(400, "product_not_seeded", "This product is not in the database yet — run the Prisma seed (npx prisma db seed).");
    }
    const problem = problemSlug
      ? await db.problem.findUnique({ where: { slug: problemSlug }, select: { id: true, titleHi: true, titleEn: true } })
      : null;
    const catalogProblem = problemSlug ? getProblem(problemSlug) : undefined;
    const problemTitle = problem
      ? locale === "en"
        ? problem.titleEn
        : problem.titleHi
      : catalogProblem
        ? pick(catalogProblem.title, locale)
        : undefined;

    const whatsappUrl = buildWhatsAppUrl({
      number: await getWhatsAppNumber(),
      message: whatsappMessage("shop", locale, {
        productTitle: locale === "en" ? product.titleEn : product.titleHi,
        sku: product.sku,
        problem: problemTitle,
      }),
    });

    await db.$transaction(async (tx) => {
      // whatsapp_phone isn't unique (one family may share a number), so reuse the oldest match.
      const existing = await tx.client.findFirst({
        where: { whatsappPhone },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      const client =
        existing ??
        (await tx.client.create({
          data: { fullName: name, whatsappPhone, preferredLang: locale },
          select: { id: true },
        }));
      await tx.shopEnquiry.create({
        data: {
          clientId: client.id,
          productId: product.id,
          problemId: problem?.id ?? null,
          name,
          phone: whatsappPhone,
          customerNote: note || null,
          // The link is returned in this same response and the UI redirects immediately.
          whatsappRedirected: true,
        },
      });
    });

    return NextResponse.json({ whatsappUrl }, { status: 201 });
  } catch (err) {
    console.error("[api/enquiry] failed", err);
    return fail(500, "server_error", "Could not save the enquiry.");
  }
}
