import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "gradient" | "whatsapp" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

// design.md §4 — sizes and variant × state matrix.
const sizes: Record<Size, string> = {
  sm: "h-9 pointer-coarse:h-11 px-3.5 text-sm gap-1.5", // 44px on touch screens (AMX-151)
  md: "h-12 px-[22px] text-base gap-2",
  lg: "h-14 px-7 text-[17px] gap-2",
  icon: "h-11 w-11 justify-center",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-grad-gold text-ink-ongold shadow-e1 hover:-translate-y-0.5 hover:shadow-glow-gold active:translate-y-0 active:scale-[.97] active:bg-saffron-600 active:bg-none active:shadow-none",
  secondary:
    "border border-line-gold text-gold-300 hover:bg-gold-300/8 hover:border-gold-300 active:bg-gold-300/14 active:scale-[.98] [.light_&]:border-saffron-600 [.light_&]:text-saffron-700",
  ghost: "text-ink-2 hover:bg-white/6 hover:text-ink-1 active:bg-white/10",
  gradient:
    "relative bg-night-s1 text-ink-1 before:absolute before:inset-0 before:-z-10 before:rounded-full before:p-[1.5px] before:bg-grad-primary before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] hover:shadow-glow-violet active:scale-[.98] isolate",
  whatsapp: "bg-[#25D366] text-[#052e16] hover:bg-[#1EBE5A] hover:-translate-y-0.5 active:scale-[.97]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:scale-[.97]",
  link: "h-auto px-0 text-violet-300 underline-offset-[3px] hover:text-gold-300 hover:underline",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, loadingLabel, iconLeft, iconRight, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "group relative inline-flex select-none items-center overflow-hidden whitespace-nowrap rounded-full font-semibold",
        "transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out",
        "focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:grayscale-[.3] disabled:hover:translate-y-0",
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {variant === "primary" && !loading && (
        // Shimmer sweep on hover (design.md §4.2)
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,.55)_50%,transparent_70%)] group-hover:animate-shimmer"
        />
      )}
      {loading ? <Spinner /> : iconLeft}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && iconRight && (
        <span className="transition-transform duration-200 group-hover:translate-x-1">{iconRight}</span>
      )}
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-[1.1em] w-[1.1em] animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
