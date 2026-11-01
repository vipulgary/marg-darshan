"use client";

export interface ApiResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown> & { error?: string; fields?: Record<string, string>; issues?: string[] };
}

/** JSON request to our own /api routes (the content-type is what the CSRF guard expects). */
export async function api(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult["data"];
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "network" } };
  }
}

/** Full navigation (not client routing) so the header picks up the new session state. */
export function go(locale: string, path: string) {
  window.location.assign(`${locale === "en" ? "/en" : ""}${path === "/" && locale === "en" ? "" : path}`);
}
