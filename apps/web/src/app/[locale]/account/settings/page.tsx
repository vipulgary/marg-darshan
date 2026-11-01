import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHead } from "@/components/account/parts";
import { SettingsForms } from "@/components/account/SettingsForms";
import { requireClient } from "@/lib/auth/require";

export default async function AccountSettings({ params }: PageProps<"/[locale]/account/settings">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireClient(locale, "/account/settings");
  const t = await getTranslations("account.settings");
  return (
    <>
      <PageHead title={t("title")} />
      <SettingsForms
        initial={{ name: me.fullName, email: me.email ?? "", phone: me.whatsappPhone ?? "", lang: me.preferredLang }}
        hasPassword={me.hasPassword}
        hasGoogle={me.hasGoogle}
      />
    </>
  );
}
