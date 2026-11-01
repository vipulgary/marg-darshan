/** Payment pages use the light theme and no effects (design.md §11.7). */
export default function PaymentLayout({ children }: LayoutProps<"/[locale]/payment">) {
  return (
    <div className="min-h-full bg-night-0 px-4 py-10 text-ink-2 sm:py-16">
      <div className="mx-auto w-full max-w-[520px]">{children}</div>
    </div>
  );
}
