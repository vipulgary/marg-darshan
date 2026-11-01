import { AuthPage, authMetadata } from "@/components/account/AuthPage";

export const generateMetadata = ({ params }: PageProps<"/[locale]/reset-password">) => authMetadata(params, "reset");

export default function Page({ params, searchParams }: PageProps<"/[locale]/reset-password">) {
  return <AuthPage mode="reset" params={params} searchParams={searchParams} />;
}
