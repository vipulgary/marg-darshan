import { AuthPage, authMetadata } from "@/components/account/AuthPage";

export const generateMetadata = ({ params }: PageProps<"/[locale]/forgot-password">) => authMetadata(params, "forgot");

export default function Page({ params, searchParams }: PageProps<"/[locale]/forgot-password">) {
  return <AuthPage mode="forgot" params={params} searchParams={searchParams} />;
}
