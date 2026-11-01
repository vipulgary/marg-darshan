import Image from "next/image";
import { useLocale } from "next-intl";
import { cn } from "@/lib/cn";

/** Marg Darshan emblem + wordmark (Devanagari on Hindi pages). */
export function BrandMark({ size = 40, className }: { size?: number; className?: string }) {
  const hi = useLocale() !== "en";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image src="/brand/emblem.png" alt="" width={size} height={size} priority className="shrink-0 rounded-full" />
      <span lang={hi ? "hi" : "en"} className="leading-none">
        {hi ? "मार्ग-दर्शन" : "Marg Darshan"}
      </span>
    </span>
  );
}
