"use client";

import { useEffect, useState } from "react";
import type { PlaceValue } from "@/lib/contracts";

export interface ViewerProfile {
  id: string;
  label: string;
  name: string;
  gender: "male" | "female" | "other" | null;
  dob: string; // YYYY-MM-DD
  tob: string; // HH:mm or "" when unknown
  place: PlaceValue;
}

export interface Viewer {
  client: { name: string; email: string | null; phone: string | null; lang: "hi" | "en"; avatarUrl: string | null };
  profiles: ViewerProfile[];
}

// One /api/auth/me request per page load, shared by the header and any form that prefills.
let pending: Promise<Viewer | null> | null = null;

function load(): Promise<Viewer | null> {
  pending ??= fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { client: Viewer["client"] | null; profiles?: ViewerProfile[] } | null) =>
      d?.client ? { client: d.client, profiles: d.profiles ?? [] } : null,
    )
    .catch(() => null);
  return pending;
}

/** `undefined` while loading, `null` when signed out. */
export function useViewer(): Viewer | null | undefined {
  const [viewer, setViewer] = useState<Viewer | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    load().then((v) => live && setViewer(v));
    return () => {
      live = false;
    };
  }, []);
  return viewer;
}
