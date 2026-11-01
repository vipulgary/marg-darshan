"use client";

import { useLocale, useTranslations } from "next-intl";
import { getProduct, pick } from "@/content/catalog";
import { usePathname } from "@/i18n/navigation";
import { buildWhatsAppUrl, whatsappContextFromPath, whatsappMessage } from "@/lib/whatsapp";
import { IconWhatsApp } from "./icons";
import { hidesWhatsAppFloat, shopSlugFromPath } from "./routes";

/**
 * AMX-100 — floating WhatsApp button (desktop; on mobile it is merged into MobileCtaBar).
 * Prefilled text follows the page and language; product pages include the title and SKU.
 */
export function WhatsAppFloat() {
  const t = useTranslations("layout.cta");
  const locale = useLocale();
  const pathname = usePathname();
  if (hidesWhatsAppFloat(pathname)) return null;

  const slug = shopSlugFromPath(pathname);
  const product = slug ? getProduct(slug) : undefined;
  const message = whatsappMessage(
    whatsappContextFromPath(pathname),
    locale,
    product ? { productTitle: pick(product.title, locale), sku: product.sku } : undefined,
  );

  return (
    <a
      href={buildWhatsAppUrl({ message })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t("whatsapp")} — ${t("floatHint")}`}
      className="group fixed bottom-6 right-6 z-40 hidden h-14 items-center gap-0 rounded-full bg-[#25D366] pl-4 pr-4 text-[#052e16] shadow-e2 transition-[transform,background-color,gap,padding] duration-200 ease-out hover:-translate-y-0.5 hover:gap-2 hover:bg-[#1EBE5A] hover:pr-5 focus-visible:gap-2 focus-visible:pr-5 focus-visible:ring-focus md:inline-flex"
    >
      <IconWhatsApp size={26} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[15px] font-semibold transition-[max-width] duration-300 ease-out group-hover:max-w-56 group-focus-visible:max-w-56">
        {t("whatsapp")}
      </span>
    </a>
  );
}
