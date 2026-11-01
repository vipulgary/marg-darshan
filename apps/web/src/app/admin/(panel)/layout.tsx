import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { logout } from "../actions";
import { Icon } from "@/components/icons";

const NAV = [
  { href: "/admin", label: "Bookings", role: "jyotish" },
  { href: "/admin/payments", label: "Payments", role: "admin" },
  { href: "/admin/enquiries", label: "Enquiries", role: "admin" },
  { href: "/admin/settings", label: "Settings", role: "admin" },
] as const;

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { role } = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-night-s1 md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block">
          <p className="flex items-center gap-1.5 font-display text-lg text-ink-1">
            <Icon name="sparkle" size={18} className="text-saffron-600" /> Marg Darshan
          </p>
          <p className="text-xs text-ink-3 md:mt-1">Signed in as {role}</p>
        </div>
        <nav aria-label="admin" className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
          {NAV.filter((n) => role === "admin" || n.role === "jyotish").map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 hover:bg-night-s2 hover:text-ink-1 focus-visible:ring-focus">
              {n.label}
            </Link>
          ))}
          <form action={logout}>
            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-3 hover:bg-night-s2 hover:text-ink-1 focus-visible:ring-focus">Sign out</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
