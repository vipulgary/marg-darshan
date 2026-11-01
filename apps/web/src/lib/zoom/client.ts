/**
 * Zoom Server-to-Server OAuth client (AMX-071). Creates one meeting per online
 * consultation. Env: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET.
 */

const OAUTH_URL = "https://zoom.us/oauth/token";
const API_URL = "https://api.zoom.us/v2";

export class ZoomError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ZoomError";
  }
}

export interface ZoomMeeting {
  id: number;
  joinUrl: string;
  startUrl: string;
  password?: string;
}

export interface CreateMeetingInput {
  topic: string;
  start: Date;
  durationMin: number;
  agenda?: string;
}

type FetchLike = typeof fetch;

interface TokenCache {
  token: string;
  expiresAt: number; // epoch ms
}

export function zoomConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.ZOOM_ACCOUNT_ID && env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET);
}

/** Meeting body for POST /users/me/meetings. Exported for tests. */
export function meetingPayload(input: CreateMeetingInput) {
  return {
    topic: input.topic.slice(0, 200),
    type: 2, // scheduled
    start_time: input.start.toISOString().replace(/\.\d{3}Z$/, "Z"),
    duration: input.durationMin,
    timezone: "Asia/Kolkata",
    agenda: input.agenda?.slice(0, 2000),
    settings: {
      join_before_host: false,
      waiting_room: true,
      host_video: true,
      participant_video: true,
      mute_upon_entry: true,
      approval_type: 2, // no registration required
    },
  };
}

export function createZoomClient(env: NodeJS.ProcessEnv = process.env, fetchImpl: FetchLike = fetch, now = () => Date.now()) {
  let cache: TokenCache | null = null;

  async function token(): Promise<string> {
    // Refresh a minute early so a request never races the expiry.
    if (cache && cache.expiresAt - 60_000 > now()) return cache.token;
    if (!zoomConfigured(env)) throw new ZoomError("Zoom is not configured");
    const basic = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString("base64");
    const url = `${OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(env.ZOOM_ACCOUNT_ID!)}`;
    const res = await fetchImpl(url, { method: "POST", headers: { Authorization: `Basic ${basic}` }, signal: AbortSignal.timeout(10_000) });
    const body = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
    if (!res.ok || !body?.access_token) throw new ZoomError("Zoom token request failed", res.status, body);
    cache = { token: body.access_token, expiresAt: now() + (body.expires_in ?? 3600) * 1000 };
    return cache.token;
  }

  async function call<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetchImpl(`${API_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json", ...init.headers },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 204) return undefined as T;
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new ZoomError(`Zoom ${init.method} ${path} failed`, res.status, body);
    return body as T;
  }

  return {
    async createMeeting(input: CreateMeetingInput): Promise<ZoomMeeting> {
      const m = await call<{ id: number; join_url: string; start_url: string; password?: string }>("/users/me/meetings", {
        method: "POST",
        body: JSON.stringify(meetingPayload(input)),
      });
      return { id: m.id, joinUrl: m.join_url, startUrl: m.start_url, password: m.password };
    },
    async deleteMeeting(id: number | string): Promise<void> {
      await call<void>(`/meetings/${encodeURIComponent(String(id))}`, { method: "DELETE" });
    },
  };
}

export type ZoomClient = ReturnType<typeof createZoomClient>;

let shared: ZoomClient | null = null;
export const zoom = () => (shared ??= createZoomClient());
