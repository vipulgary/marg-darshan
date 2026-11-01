import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildWhatsAppUrl,
  normalizeWhatsAppNumber,
  stripLocale,
  whatsappContextFromPath,
  whatsappMessage,
} from "./whatsapp";

test("buildWhatsAppUrl encodes Devanagari and newlines", () => {
  const url = buildWhatsAppUrl({ number: "+91 98765-43210", message: "नमस्ते\nवास्तु" });
  assert.equal(url, `https://wa.me/919876543210?text=${encodeURIComponent("नमस्ते\nवास्तु")}`);
  assert.ok(url.includes("%E0%A4%A8")); // न
  assert.ok(url.includes("%0A"));
  assert.equal(decodeURIComponent(new URL(url).searchParams.get("text") ?? ""), "नमस्ते\nवास्तु");
});

test("buildWhatsAppUrl escapes reserved URL characters", () => {
  const url = buildWhatsAppUrl({ number: "919876543210", message: "A & B? #1 = 100%" });
  assert.equal(new URL(url).searchParams.get("text"), "A & B? #1 = 100%");
});

test("normalizeWhatsAppNumber handles bare, prefixed and placeholder numbers", () => {
  assert.equal(normalizeWhatsAppNumber("9876543210"), "919876543210");
  assert.equal(normalizeWhatsAppNumber("+91-98765 43210"), "919876543210");
  assert.equal(normalizeWhatsAppNumber("91XXXXXXXXXX"), null);
  assert.equal(normalizeWhatsAppNumber(undefined), null);
});

test("buildWhatsAppUrl falls back to the chat picker when the number is a placeholder", () => {
  assert.equal(buildWhatsAppUrl({ number: "91XXXXXXXXXX", message: "hi" }), "https://wa.me/?text=hi");
});

test("whatsappMessage is locale-aware with Hindi as default", () => {
  assert.equal(whatsappMessage("vastu", "hi"), "नमस्ते, मुझे वास्तु परामर्श के बारे में जानकारी चाहिए।");
  assert.equal(whatsappMessage("vastu", "en"), "Hello, I'd like to know more about a Vastu consultation.");
  assert.equal(whatsappMessage("vastu", "fr"), whatsappMessage("vastu", "hi"));
  for (const ctx of ["general", "astrology", "vastu", "gems", "shop", "kundali", "booking", "birthTime"] as const) {
    assert.notEqual(whatsappMessage(ctx, "hi"), whatsappMessage(ctx, "en"), ctx);
    assert.ok(whatsappMessage(ctx, "hi").length > 10);
  }
});

test("shop message carries product title, SKU and problem", () => {
  const msg = whatsappMessage("shop", "en", { productTitle: "Ruby (Manik)", sku: "GEM-MAN-001", problem: "Career" });
  assert.match(msg, /"Ruby \(Manik\)"/);
  assert.match(msg, /SKU: GEM-MAN-001/);
  assert.match(msg, /My concern: Career/);
  assert.match(msg, /suitability/);
  const hi = whatsappMessage("shop", "hi", { productTitle: "माणिक", sku: "GEM-MAN-001" });
  assert.match(hi, /"माणिक"/);
  assert.match(hi, /SKU: GEM-MAN-001/);
  assert.doesNotMatch(hi, /समस्या/);
});

test("non-shop contexts append the problem when given", () => {
  assert.equal(
    whatsappMessage("booking", "hi", { problem: "विवाह" }),
    "नमस्ते, मुझे परामर्श बुक करने में मदद चाहिए।\nमेरी समस्या: विवाह",
  );
});

test("whatsappContextFromPath maps routes with or without locale prefix", () => {
  assert.equal(whatsappContextFromPath("/"), "general");
  assert.equal(whatsappContextFromPath("/services/vastu"), "vastu");
  assert.equal(whatsappContextFromPath("/en/services/gems"), "gems");
  assert.equal(whatsappContextFromPath("/services/astrology?x=1"), "astrology");
  assert.equal(whatsappContextFromPath("/shop/ruby-manik"), "shop");
  assert.equal(whatsappContextFromPath("/en/kundali/abc"), "kundali");
  assert.equal(whatsappContextFromPath("/free-kundali"), "kundali");
  assert.equal(whatsappContextFromPath("/book-appointment"), "booking");
  assert.equal(whatsappContextFromPath("/birth-time-finder"), "birthTime");
  assert.equal(whatsappContextFromPath("/about-jyotish"), "general");
});

test("stripLocale", () => {
  assert.equal(stripLocale("/en"), "/");
  assert.equal(stripLocale("/en/shop"), "/shop");
  assert.equal(stripLocale("/english-page"), "/english-page");
  assert.equal(stripLocale("/shop#x"), "/shop");
});
