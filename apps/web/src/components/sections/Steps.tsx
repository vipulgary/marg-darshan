import { cn } from "@/lib/cn";

/** Numbered gold circles joined by a dotted line (design.md §11.1 #6). Horizontal on desktop, vertical on mobile. */
export function Steps({ items, className }: { items: { title: string; body: string }[]; className?: string }) {
  return (
    <ol
      className={cn(
        "relative grid gap-8",
        items.length === 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-5",
        className,
      )}
    >
      {items.map((s, i) => (
        <li key={s.title} className="relative flex gap-5 lg:flex-col lg:items-start lg:gap-4">
          {i < items.length - 1 && (
            <>
              {/* connector: vertical (mobile) / horizontal (desktop) dotted line */}
              <span
                aria-hidden
                className="absolute left-[21px] top-12 h-[calc(100%-20px)] border-l-2 border-dotted border-gold-300/35 lg:hidden"
              />
              <span
                aria-hidden
                className="absolute left-14 -right-6 top-[21px] hidden border-t-2 border-dotted border-gold-300/35 lg:block"
              />
            </>
          )}
          <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-grad-gold text-lg font-bold text-ink-ongold shadow-glow-gold tabular-nums">
            {i + 1}
          </span>
          <div className="flex flex-col gap-1.5 pt-1.5 lg:pt-0">
            <h3 className="text-xl">{s.title}</h3>
            <p className="text-[15px] text-ink-2">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
