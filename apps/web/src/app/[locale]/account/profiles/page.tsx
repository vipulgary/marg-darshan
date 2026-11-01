import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHead } from "@/components/account/parts";
import { ProfilesManager } from "@/components/account/ProfilesManager";
import { listSavedProfiles } from "@/lib/account/queries";
import { requireClient } from "@/lib/auth/require";

export default async function AccountProfiles({ params }: PageProps<"/[locale]/account/profiles">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await requireClient(locale, "/account/profiles");
  const t = await getTranslations("account.profiles");
  return (
    <>
      <PageHead title={t("title")} lead={t("lead")} />
      <ProfilesManager initial={await listSavedProfiles(me.id)} />
    </>
  );
}
