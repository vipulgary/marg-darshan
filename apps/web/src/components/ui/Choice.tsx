import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type BoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; hint?: ReactNode };

/** design.md §5.3 — gold-filled box with a drawn check mark. */
export const Checkbox = forwardRef<HTMLInputElement, BoxProps & { featured?: boolean }>(function Checkbox(
  { label, hint, featured, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex cursor-pointer items-start gap-2.5 text-[15px] text-ink-2 has-disabled:cursor-not-allowed has-disabled:opacity-40",
        featured &&
          "rounded-lg border border-line bg-night-s2 p-4 transition-colors hover:border-line-hover has-checked:border-line-gold has-checked:bg-saffron-500/8",
        className,
      )}
    >
      <span className="relative mt-[3px] grid h-5 w-5 shrink-0 place-items-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-xs border-[1.5px] border-ink-3 transition-all duration-150 group-hover:border-gold-300 group-hover:bg-gold-300/6 checked:scale-100 checked:border-transparent checked:bg-grad-gold focus-visible:ring-focus aria-invalid:border-error disabled:cursor-not-allowed"
          {...rest}
        />
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute h-3.5 w-3.5 text-ink-ongold [stroke-dasharray:20] [stroke-dashoffset:20] transition-[stroke-dashoffset] duration-200 peer-checked:[stroke-dashoffset:0]"
        >
          <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex flex-col gap-0.5">
        <span className={cn(featured && "font-semibold text-ink-1")}>{label}</span>
        {hint && <span className="text-[13px] text-ink-3">{hint}</span>}
      </span>
    </label>
  );
});

/** design.md §5.4 — radio rendered as a chip-like option. */
export const Radio = forwardRef<HTMLInputElement, BoxProps>(function Radio({ label, className, ...rest }, ref) {
  return (
    <label className={cn("group inline-flex cursor-pointer items-center gap-2.5 text-[15px] text-ink-2", className)}>
      <span className="relative grid h-5 w-5 place-items-center">
        <input
          ref={ref}
          type="radio"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-[1.5px] border-ink-3 transition-colors group-hover:border-gold-300 checked:border-saffron-400 focus-visible:ring-focus"
          {...rest}
        />
        <span className="pointer-events-none absolute h-2.5 w-2.5 scale-0 rounded-full bg-grad-gold transition-transform duration-200 ease-out peer-checked:scale-100" />
      </span>
      <span className="group-has-checked:text-ink-1">{label}</span>
    </label>
  );
});

/** design.md §5.5 — 44×24 switch. */
export const Switch = forwardRef<HTMLInputElement, BoxProps>(function Switch({ label, className, ...rest }, ref) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-3 text-[15px] text-ink-2", className)}>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-full bg-night-s3 transition-colors checked:bg-grad-gold focus-visible:ring-focus"
          {...rest}
        />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
});

/** design.md §5.6 — problem / mode / plan picker card (radio semantics). */
export function SelectableCard({
  name,
  value,
  title,
  subtitle,
  icon,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  value: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 rounded-lg border border-line bg-night-s1 p-5 transition-all duration-200 ease-out",
        "hover:-translate-y-[3px] hover:border-line-hover hover:shadow-e2",
        "has-checked:border-transparent has-checked:bg-saffron-500/8",
        "has-focus-visible:ring-focus has-disabled:pointer-events-none has-disabled:opacity-40",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.(value)}
        className="peer sr-only"
      />
      {/* gradient border when selected */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg p-[1.5px] opacity-0 transition-opacity bg-grad-primary [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] peer-checked:opacity-100"
      />
      <span
        aria-hidden
        className="absolute right-3 top-3 grid h-[22px] w-[22px] scale-0 place-items-center rounded-full bg-grad-gold text-ink-ongold transition-transform duration-200 peer-checked:scale-100"
      >
        <svg viewBox="0 0 20 20" className="h-3 w-3">
          <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
      {icon && (
        <span className="text-gold-300 transition-[filter] group-hover:drop-shadow-[0_0_10px_rgba(252,217,138,.4)]">
          {icon}
        </span>
      )}
      <span className="flex flex-col gap-0.5">
        <span className="text-lg font-semibold text-ink-1 peer-checked:text-gold-200">{title}</span>
        {subtitle && <span className="text-sm text-ink-3">{subtitle}</span>}
      </span>
    </label>
  );
}
