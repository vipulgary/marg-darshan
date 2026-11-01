import { connection } from "next/server";
import { redirect } from "@/i18n/navigation";
import { type CurrentClient, getCurrentClient } from "./session";

/** Top of every /account page: the signed-in client, or a redirect to /login?next=<path>. */
export async function requireClient(locale: string, path: string): Promise<CurrentClient> {
  await connection();
  const me = await getCurrentClient();
  if (!me) redirect({ href: `/login?next=${encodeURIComponent(path)}`, locale });
  return me!;
}
