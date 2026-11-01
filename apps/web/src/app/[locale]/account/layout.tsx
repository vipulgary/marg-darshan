import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountNav } from "@/components/account/AccountNav";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/account">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.meta" });
  return { title: t("account"), description: t("description"), robots: { index: false, follow: false } };
}

export default async function AccountLayout({ children, params }: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-page min-h-[calc(100svh-60px)] py-8 sm:py-12 md:min-h-[calc(100svh-72px)]">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
