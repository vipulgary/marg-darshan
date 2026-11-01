import assert from "node:assert/strict";
import { test } from "node:test";
import { safeEqual, signToken, verifyToken } from "./signed-token";

const SECRET = "s3cret";

test("round-trips claims until expiry", () => {
  const t = signToken({ sub: "appt-1", act: "manage" }, SECRET, 60, 1_000_000);
  const claims = verifyToken<{ sub: string; act: string }>(t, SECRET, 1_000_000 + 59_000);
  assert.equal(claims?.sub, "appt-1");
  assert.equal(verifyToken(t, SECRET, 1_000_000 + 60_000), null);
});

test("rejects tampering, wrong secret and junk", () => {
  const t = signToken({ sub: "a" }, SECRET, 60);
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ sub: "b", exp: 9_999_999_999 })).toString("base64url");
  assert.equal(verifyToken(`${forged}.${sig}`, SECRET), null);
  assert.equal(verifyToken(t, "other"), null);
  assert.equal(verifyToken(`${body}.`, SECRET), null);
  assert.equal(verifyToken("not-a-token", SECRET), null);
  assert.equal(verifyToken(`${t}.extra`, SECRET), null);
  assert.equal(verifyToken(undefined, SECRET), null);
});

test("refuses to sign without a secret", () => {
  assert.throws(() => signToken({}, "", 60));
});

test("safeEqual", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});
