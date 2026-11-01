import { SERVICES, getService } from "@/content/catalog";
import { OG_ALT, OG_COPY } from "@/lib/og/copy";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/render";

export const alt = OG_ALT.service;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return SERVICES.filter((s) => ["astrology", "vastu", "gems"].includes(s.slug)).map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const service = getService(slug);
  if (!service) return renderOgImage({ locale, ...OG_COPY.home });
  return renderOgImage({ locale, eyebrow: OG_COPY.service, title: service.title, subtitle: service.summary });
}
