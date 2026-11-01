import { AuthPage, authMetadata } from "@/components/account/AuthPage";

export const generateMetadata = ({ params }: PageProps<"/[locale]/login">) => authMetadata(params, "login");

export default function Page({ params, searchParams }: PageProps<"/[locale]/login">) {
  return <AuthPage mode="login" params={params} searchParams={searchParams} />;
}
