import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { clientIp, rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit, then blocks with a retry hint", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) assert.equal(rateLimit("ip:a", 5, 60_000, t0 + i).ok, true);
    const blocked = rateLimit("ip:a", 5, 60_000, t0 + 10);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.retryAfterSec, 60);
  });

  it("slides: old hits fall out of the window", () => {
    const t0 = 2_000_000;
    rateLimit("ip:b", 2, 10_000, t0);
    rateLimit("ip:b", 2, 10_000, t0 + 5_000);
    assert.equal(rateLimit("ip:b", 2, 10_000, t0 + 9_000).ok, false);
    // first hit expires at t0 + 10s
    assert.equal(rateLimit("ip:b", 2, 10_000, t0 + 10_001).ok, true);
    assert.equal(rateLimit("ip:b", 2, 10_000, t0 + 10_002).ok, false);
  });

  it("keeps keys independent", () => {
    const t0 = 3_000_000;
    assert.equal(rateLimit("ip:c", 1, 1_000, t0).ok, true);
    assert.equal(rateLimit("ip:c", 1, 1_000, t0).ok, false);
    assert.equal(rateLimit("ip:d", 1, 1_000, t0).ok, true);
  });

  it("does not count blocked attempts", () => {
    const t0 = 4_000_000;
    rateLimit("ip:e", 1, 1_000, t0);
    for (let i = 0; i < 10; i++) rateLimit("ip:e", 1, 1_000, t0 + 100 + i);
    assert.equal(rateLimit("ip:e", 1, 1_000, t0 + 1_001).ok, true);
  });

  it("sweeps expired buckets without breaking live ones", () => {
    const t0 = 5_000_000;
    rateLimit("ip:old", 1, 1_000, t0);
    rateLimit("ip:live", 1, 600_000, t0);
    // more than a sweep interval later
    assert.equal(rateLimit("ip:other", 1, 1_000, t0 + 120_000).ok, true);
    assert.equal(rateLimit("ip:live", 1, 600_000, t0 + 120_000).ok, false);
    assert.equal(rateLimit("ip:old", 1, 1_000, t0 + 120_000).ok, true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x.test/", { headers });

  it("uses the first x-forwarded-for hop", () => {
    assert.equal(clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
  });
  it("falls back to x-real-ip, then unknown", () => {
    assert.equal(clientIp(req({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
    assert.equal(clientIp(req({})), "unknown");
  });
});
