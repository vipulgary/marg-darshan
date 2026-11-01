import { AuthPage, authMetadata } from "@/components/account/AuthPage";

export const generateMetadata = ({ params }: PageProps<"/[locale]/signup">) => authMetadata(params, "signup");

export default function Page({ params, searchParams }: PageProps<"/[locale]/signup">) {
  return <AuthPage mode="signup" params={params} searchParams={searchParams} />;
}
