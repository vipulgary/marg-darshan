import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { ThemeScript } from "@/components/layout/ThemeScript";
import { SpotlightTracker } from "@/components/effects/SpotlightTracker";
import { Header } from "@/components/layout/Header";
import { MobileCtaBar } from "@/components/layout/MobileCtaBar";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { ToastProvider } from "@/components/ui/Interactive";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(SITE),
    title: t("title"),
    description: t("description"),
    // hreflang: Hindi at "/", English at "/en" (AMX-020)
    alternates: {
      canonical: locale === "hi" ? "/" : "/en",
      languages: { "hi-IN": "/", "en-IN": "/en", "x-default": "/" },
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "layout" });

  return (
    <html lang={locale} className={`${fontVariables} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* Applies the saved light/dark choice before first paint (no flash). */}
        <ThemeScript />
        <NextIntlClientProvider>
          <MotionProvider>
            <ToastProvider>
              <a
                href="#main"
                className="sr-only z-[70] rounded-full bg-grad-gold px-5 py-3 font-semibold text-ink-ongold focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus-visible:ring-focus"
              >
                {t("skipToContent")}
              </a>
              <Header />
              <main id="main" tabIndex={-1} className="flex-1 outline-none">
                {children}
              </main>
              <Footer />
              <SpotlightTracker />
              {/* AMX-006: privacy-friendly analytics (no cookies); only when configured. */}
              {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
              <Script
                defer
                data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
                src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js"}
                strategy="afterInteractive"
              />
            )}
              <MobileCtaBar />
              <WhatsAppFloat />
            </ToastProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
