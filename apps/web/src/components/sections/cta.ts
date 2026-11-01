import { cn } from "@/lib/cn";

/** Button styles (design.md §4) for <Link>/<a> CTAs — the UI-kit Button renders a <button>. */
type Variant = "primary" | "secondary" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-11 px-4 text-sm gap-1.5",
  md: "h-12 px-[22px] text-base gap-2",
  lg: "h-14 px-7 text-[17px] gap-2",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-grad-gold text-ink-ongold shadow-e1 hover:-translate-y-0.5 hover:shadow-glow-gold active:translate-y-0 active:scale-[.97]",
  secondary:
    "border border-line-gold text-gold-300 hover:bg-gold-300/8 hover:border-gold-300 active:scale-[.98] [.light_&]:border-saffron-600 [.light_&]:text-saffron-700",
  ghost: "text-ink-2 hover:bg-white/6 hover:text-ink-1",
  whatsapp: "bg-[#25D366] text-[#052e16] hover:bg-[#1EBE5A] hover:-translate-y-0.5 active:scale-[.97]",
};

export function ctaClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "group relative inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full font-semibold",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out focus-visible:ring-focus",
    sizes[size],
    variants[variant],
    className,
  );
}

/** Inline text link (design.md §2.3): violet → gold with an underline that grows from the left. */
export const textLinkClass = cn(
  "relative inline-flex items-center gap-1.5 rounded-sm pb-0.5 font-semibold text-violet-300 focus-visible:ring-focus",
  // Invisible hit-area extension to >=44px tall without moving the underline away from the text.
  "before:absolute before:-inset-y-2 before:inset-x-0 before:content-['']",
  "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-[position:0_100%] bg-no-repeat",
  "transition-[background-size,color] duration-200 hover:bg-[length:100%_1.5px] hover:text-gold-300",
  "[.light_&]:text-saffron-700",
);
