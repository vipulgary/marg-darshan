import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { getSession } from "@/lib/admin/auth";
import { login } from "../actions";
import { Icon } from "@/components/icons";

const ERRORS: Record<string, string> = {
  invalid: "Incorrect password.",
  throttled: "Too many attempts. Try again in 15 minutes.",
  config: "Admin login is not configured. Set ADMIN_SESSION_SECRET and ADMIN_PASSWORD.",
};

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getSession()) redirect("/admin");
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form action={login} className="w-full max-w-sm rounded-xl border border-line bg-night-s1 p-8 shadow-e2">
        <p className="mb-1 flex items-center gap-2 font-display text-2xl text-ink-1">
          <Icon name="sparkle" size={22} animate="draw" className="text-saffron-600" />
          Marg Darshan Admin
        </p>
        <p className="mb-6 text-sm text-ink-3">Sign in with the admin or Jyotish password.</p>
        {message && (
          <p role="alert" className="mb-4 rounded-md bg-error/12 px-3 py-2 text-sm text-error">
            {message}
          </p>
        )}
        <Field label="Password" required>
          {(id) => <Input id={id} name="password" type="password" autoComplete="current-password" required autoFocus />}
        </Field>
        <Button type="submit" className="mt-6 w-full justify-center">
          Sign in
        </Button>
      </form>
    </main>
  );
}
