import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

// Separate root layout: the admin is English-only, light theme, never indexed.
export const metadata: Metadata = {
  title: { default: "Marg Darshan Admin", template: "%s · Marg Darshan Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${fontVariables} light h-full`}>
      <body className="min-h-full bg-night-1 text-ink-2">{children}</body>
    </html>
  );
}
