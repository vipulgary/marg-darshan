import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { hmacSha256Hex, verifyCheckoutSignature, verifyWebhookSignature } from "./signature";

// Known vector computed independently with node:crypto in the test itself.
const SECRET = "test_secret_Kx9";
const ORDER = "order_NBGs7Uf1q4sDCn";
const PAYMENT = "pay_NBGsJ8p2ZQq3xE";
const expected = createHmac("sha256", SECRET).update(`${ORDER}|${PAYMENT}`).digest("hex");

describe("hmacSha256Hex", () => {
  it("matches the RFC 4231 test case 2 vector", () => {
    assert.equal(
      hmacSha256Hex("what do ya want for nothing?", "Jefe"),
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
});

describe("verifyCheckoutSignature", () => {
  it("accepts the correct signature", () => {
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, expected, SECRET), true);
  });
  it("accepts an upper-case hex signature", () => {
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, expected.toUpperCase(), SECRET), true);
  });
  it("rejects a tampered payment id", () => {
    assert.equal(verifyCheckoutSignature(ORDER, "pay_other", expected, SECRET), false);
  });
  it("rejects the wrong secret", () => {
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, expected, "nope"), false);
  });
  it("rejects wrong-length or non-hex signatures without throwing", () => {
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, expected.slice(0, 63), SECRET), false);
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, `${expected}00`, SECRET), false);
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, "z".repeat(64), SECRET), false);
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, "", SECRET), false);
  });
  it("rejects empty inputs", () => {
    assert.equal(verifyCheckoutSignature("", PAYMENT, expected, SECRET), false);
    assert.equal(verifyCheckoutSignature(ORDER, "", expected, SECRET), false);
    assert.equal(verifyCheckoutSignature(ORDER, PAYMENT, expected, ""), false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ entity: "event", event: "payment.captured", payload: { payment: { entity: { id: PAYMENT } } } });
  const sig = createHmac("sha256", "whsec_123").update(body).digest("hex");

  it("accepts the signature of the exact raw body", () => {
    assert.equal(verifyWebhookSignature(body, sig, "whsec_123"), true);
  });
  it("rejects when a single byte of the body changes", () => {
    assert.equal(verifyWebhookSignature(body.replace("captured", "capturex"), sig, "whsec_123"), false);
  });
  it("rejects re-serialised JSON with different whitespace", () => {
    assert.equal(verifyWebhookSignature(JSON.stringify(JSON.parse(body), null, 2), sig, "whsec_123"), false);
  });
  it("rejects missing signature, empty body or empty secret", () => {
    assert.equal(verifyWebhookSignature(body, null, "whsec_123"), false);
    assert.equal(verifyWebhookSignature(body, undefined, "whsec_123"), false);
    assert.equal(verifyWebhookSignature("", sig, "whsec_123"), false);
    assert.equal(verifyWebhookSignature(body, sig, ""), false);
  });
  it("handles Devanagari in the body (UTF-8 bytes are signed)", () => {
    const hiBody = JSON.stringify({ notes: { name: "राहुल शर्मा" } });
    const hiSig = createHmac("sha256", "s").update(Buffer.from(hiBody, "utf8")).digest("hex");
    assert.equal(verifyWebhookSignature(hiBody, hiSig, "s"), true);
  });
});
