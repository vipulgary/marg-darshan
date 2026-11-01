/**
 * AMX-004 seed: upserts problems, services, plans and products from the shared
 * catalog. Idempotent — safe to run on every deploy (`npx prisma db seed`).
 */
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PLANS, PROBLEMS, PRODUCTS, SERVICES, getService } from "../src/content/catalog";
import { PrismaClient } from "../src/generated/prisma/client";

for (const file of ["../../.env", ".env"]) if (!process.env.DATABASE_URL && existsSync(file)) process.loadEnvFile(file);

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set — cannot seed");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    for (const s of SERVICES) {
      const data = {
        serviceType: s.type,
        titleHi: s.title.hi,
        titleEn: s.title.en,
        modes: s.modes,
        durations: s.durations,
        basePriceInr: Math.min(...s.durations.map((d) => s.prices[d])),
        splitAllowed: s.splitAllowed,
        // single column: the online event type; the Cal.com adapter reads per-mode slugs from the catalog
        calEventSlug: s.calEventSlug.ONLINE_ZOOM ?? Object.values(s.calEventSlug)[0] ?? null,
        active: true,
      };
      await db.service.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data }, update: data });
    }

    for (const [sort, p] of PROBLEMS.entries()) {
      const service = getService(p.serviceSlug);
      if (!service) throw new Error(`problem ${p.slug}: unknown service ${p.serviceSlug}`);
      const data = {
        titleHi: p.title.hi,
        titleEn: p.title.en,
        icon: p.icon,
        serviceType: service.type,
        defaultDuration: p.defaultDuration,
        sort,
        active: true,
      };
      await db.problem.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
    }

    for (const p of PLANS) {
      const service = await db.service.findUniqueOrThrow({ where: { slug: p.serviceSlug }, select: { id: true } });
      const data = {
        serviceId: service.id,
        nameHi: p.name.hi,
        nameEn: p.name.en,
        priceInr: p.priceInr,
        sessions: p.sessions,
        durationMin: p.durationMin,
        planType: p.planType,
        advancePct: p.advancePct ?? null,
        featured: p.featured ?? false,
      };
      await db.plan.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
    }

    for (const p of PRODUCTS) {
      const data = {
        sku: p.sku,
        category: p.category,
        titleHi: p.title.hi,
        titleEn: p.title.en,
        descHi: p.description.hi,
        descEn: p.description.en,
        images: [p.image],
        // single column: Hindi (default locale); the site renders the bilingual hint from the catalog
        priceHint: p.priceHint.hi,
        certified: p.certified,
        active: true,
      };
      await db.product.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
    }

    console.info(
      `seeded ${SERVICES.length} services, ${PROBLEMS.length} problems, ${PLANS.length} plans, ${PRODUCTS.length} products`,
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
