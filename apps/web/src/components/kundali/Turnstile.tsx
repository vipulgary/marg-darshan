"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Cloudflare Turnstile, rendered explicitly so it also works after client-side navigation. */
export function Turnstile({ siteKey, locale, onToken }: { siteKey: string; locale: string; onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!ready || !ref.current || !window.turnstile) return;
    const id = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      theme: "dark",
      language: locale,
      callback: (token: string) => cb.current(token),
      "expired-callback": () => cb.current(""),
      "error-callback": () => cb.current(""),
    });
    return () => window.turnstile?.remove(id);
  }, [ready, siteKey, locale]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
