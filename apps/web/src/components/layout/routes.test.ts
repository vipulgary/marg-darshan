import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookingHrefFor,
  hidesMobileCtaBar,
  hidesWhatsAppFloat,
  isActivePath,
  isServicesPath,
  shopSlugFromPath,
} from "./routes";

test("isActivePath matches segments, not prefixes", () => {
  assert.equal(isActivePath("/", "/"), true);
  assert.equal(isActivePath("/en", "/"), true);
  assert.equal(isActivePath("/shop", "/"), false);
  assert.equal(isActivePath("/shop/ruby-manik", "/shop"), true);
  assert.equal(isActivePath("/shopping", "/shop"), false);
  assert.equal(isActivePath("/en/pricing", "/pricing"), true);
});

test("services menu is active on service and birth-time pages", () => {
  assert.equal(isServicesPath("/services/vastu"), true);
  assert.equal(isServicesPath("/birth-time-finder"), true);
  assert.equal(isServicesPath("/free-kundali"), false);
});

test("mobile CTA bar hides on funnel and checkout only", () => {
  assert.equal(hidesMobileCtaBar("/book-appointment"), true);
  assert.equal(hidesMobileCtaBar("/en/payment/abc"), true);
  assert.equal(hidesMobileCtaBar("/payment/success"), true);
  assert.equal(hidesMobileCtaBar("/kundali/abc"), false);
  assert.equal(hidesMobileCtaBar("/"), false);
});

test("WhatsApp float hides on payment only", () => {
  assert.equal(hidesWhatsAppFloat("/payment/abc"), true);
  assert.equal(hidesWhatsAppFloat("/book-appointment"), false);
});

test("bookingHrefFor preselects a matching problem", () => {
  assert.equal(bookingHrefFor("/services/vastu"), "/book-appointment?problem=vastu-residential");
  assert.equal(bookingHrefFor("/en/birth-time-finder"), "/book-appointment?problem=birth-time-unknown");
  assert.equal(bookingHrefFor("/about-jyotish"), "/book-appointment");
});

test("shopSlugFromPath", () => {
  assert.equal(shopSlugFromPath("/shop/ruby-manik"), "ruby-manik");
  assert.equal(shopSlugFromPath("/en/shop/ruby-manik"), "ruby-manik");
  assert.equal(shopSlugFromPath("/shop"), null);
});
