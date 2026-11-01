"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR and the hydration pass, true afterwards — gates sessionStorage-backed drafts. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
