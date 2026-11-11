// Client-safe account UI helpers. Kept apart from ./parts (server-only:
// it signs manage links with node:crypto) so client components can import them.
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

export function Empty({ icon, children, action }: { icon: IconName; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line bg-night-s1 px-6 py-12 text-center text-ink-2">
      <Icon name={icon} size={32} className="text-gold-300" />
      <p>{children}</p>
      {action}
    </div>
  );
}

export const pillLink =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-ink-1 transition-colors hover:border-line-hover hover:bg-night-s2 focus-visible:ring-focus";
export const goldLink =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-sm font-semibold text-ink-ongold transition-all hover:-translate-y-0.5 hover:shadow-glow-gold focus-visible:ring-focus";
