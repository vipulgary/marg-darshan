import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
  useId,
} from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";

// design.md §5.1 — shared control styling for input / textarea / select.
export const controlClass = cn(
  "w-full rounded-md border border-line bg-night-s2 px-4 text-base text-ink-1 placeholder:text-ink-3",
  "transition-[border-color,box-shadow] duration-150 ease-out",
  "hover:border-line-hover",
  "focus:border-saffron-400 focus:outline-none focus:shadow-[0_0_0_4px_rgba(245,158,11,.18)]",
  "disabled:cursor-not-allowed disabled:bg-night-s1 disabled:text-ink-3 disabled:opacity-60",
  "read-only:border-dashed",
  "aria-invalid:border-error aria-invalid:shadow-[0_0_0_4px_rgba(248,113,113,.15)] aria-invalid:animate-shake",
);

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="group/field flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink-2 transition-colors group-focus-within/field:text-gold-300">
        {label}
        {required && <span className="ml-0.5 text-saffron-400">*</span>}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-[13px] text-error">
          <Icon name="alert-triangle" size={14} animate="none" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-3">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cn(controlClass, "h-[52px]", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(controlClass, "min-h-[120px] resize-y py-3 [field-sizing:content]", className)}
        {...rest}
      />
    );
  },
);

/** Native select styled as design.md §5.2 trigger (keeps mobile pickers + a11y for free). */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(controlClass, "peer h-[52px] cursor-pointer appearance-none pr-11", className)} {...rest}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3 transition-transform duration-200 peer-focus:rotate-180 peer-focus:text-gold-300"
      >
        <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});
