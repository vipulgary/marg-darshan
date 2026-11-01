import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCronAuthorized } from "./auth";

const req = (headers: Record<string, string>) => new Request("http://x/api/cron/reminders", { headers });

describe("isCronAuthorized", () => {
  it("accepts x-cron-secret and Vercel bearer", () => {
    assert.equal(isCronAuthorized(req({ "x-cron-secret": "s3cret" }), "s3cret"), true);
    assert.equal(isCronAuthorized(req({ authorization: "Bearer s3cret" }), "s3cret"), true);
  });
  it("rejects wrong or missing secrets", () => {
    assert.equal(isCronAuthorized(req({}), "s3cret"), false);
    assert.equal(isCronAuthorized(req({ "x-cron-secret": "nope" }), "s3cret"), false);
    assert.equal(isCronAuthorized(req({ authorization: "Basic s3cret" }), "s3cret"), false);
  });
});
