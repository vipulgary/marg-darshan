"use client";

import { useSyncExternalStore } from "react";
import { THEME_INIT_SCRIPT } from "./ThemeToggle";

const noop = () => () => {};

/**
 * Applies the saved light/dark choice before first paint. The <script> exists only in the server
 * HTML (and is adopted during hydration); later client re-renders, e.g. switching language, render
 * nothing — React never creates a script element on the client, so it doesn't warn.
 * ThemeToggle restores the class if a re-render drops it.
 */
export function ThemeScript() {
  const fromServer = useSyncExternalStore(noop, () => false, () => true);
  return fromServer ? <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /> : null;
}
