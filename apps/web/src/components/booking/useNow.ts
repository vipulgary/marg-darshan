"use client";

import { useSyncExternalStore } from "react";

// One shared 1s ticker for every countdown on the page.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const noop = () => () => {};

/** Current epoch ms, refreshed every second while `enabled`; 0 until the first tick (and on the server). */
export function useNow(enabled = true): number {
  return useSyncExternalStore(enabled ? subscribe : noop, () => now, () => 0);
}
