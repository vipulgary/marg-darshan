import assert from "node:assert/strict";
import { test } from "node:test";
import { ZoomError, createZoomClient, meetingPayload } from "./client";

const env = { ZOOM_ACCOUNT_ID: "acc", ZOOM_CLIENT_ID: "id", ZOOM_CLIENT_SECRET: "secret" } as unknown as NodeJS.ProcessEnv;

function fakeFetch() {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (String(url).startsWith("https://zoom.us/oauth/token")) {
      return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
    }
    return new Response(JSON.stringify({ id: 42, join_url: "https://zoom.us/j/42", start_url: "https://zoom.us/s/42", password: "x" }), { status: 201 });
  }) as typeof fetch;
  return { calls, impl };
}

test("meeting payload uses IST timezone and a UTC start time", () => {
  const p = meetingPayload({ topic: "Consultation", start: new Date("2026-11-02T04:30:00.000Z"), durationMin: 60 });
  assert.equal(p.start_time, "2026-11-02T04:30:00Z");
  assert.equal(p.timezone, "Asia/Kolkata");
  assert.equal(p.type, 2);
  assert.equal(p.settings.waiting_room, true);
});

test("token is fetched once and reused until near expiry", async () => {
  const f = fakeFetch();
  let t = 0;
  const client = createZoomClient(env, f.impl, () => t);
  await client.createMeeting({ topic: "a", start: new Date(), durationMin: 30 });
  await client.createMeeting({ topic: "b", start: new Date(), durationMin: 30 });
  assert.equal(f.calls.filter((c) => c.url.includes("oauth")).length, 1);
  t = 3600 * 1000; // past expiry
  await client.createMeeting({ topic: "c", start: new Date(), durationMin: 30 });
  assert.equal(f.calls.filter((c) => c.url.includes("oauth")).length, 2);
  const auth = (f.calls[0].init?.headers as Record<string, string>).Authorization;
  assert.equal(auth, `Basic ${Buffer.from("id:secret").toString("base64")}`);
});

test("maps the API response and throws ZoomError when unconfigured", async () => {
  const f = fakeFetch();
  const m = await createZoomClient(env, f.impl).createMeeting({ topic: "x", start: new Date(), durationMin: 30 });
  assert.deepEqual(m, { id: 42, joinUrl: "https://zoom.us/j/42", startUrl: "https://zoom.us/s/42", password: "x" });
  await assert.rejects(createZoomClient({} as unknown as NodeJS.ProcessEnv, f.impl).createMeeting({ topic: "x", start: new Date(), durationMin: 30 }), ZoomError);
});
