import { AuthPage, authMetadata } from "@/components/account/AuthPage";

export const generateMetadata = ({ params }: PageProps<"/[locale]/verify-email">) => authMetadata(params, "verify");

export default function Page({ params, searchParams }: PageProps<"/[locale]/verify-email">) {
  return <AuthPage mode="verify" params={params} searchParams={searchParams} />;
}
