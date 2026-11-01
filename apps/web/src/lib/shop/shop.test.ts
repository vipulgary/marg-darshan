import assert from "node:assert/strict";
import { test } from "node:test";
import { PRODUCTS, getProduct } from "../../content/catalog";
import {
  consultProblemFor,
  filterForCategory,
  filterProducts,
  parseShopFilter,
  productTint,
  relatedProducts,
} from "./catalog";
import { enquiryFieldErrors, enquirySchema } from "./enquiry";
import { isIndianMobile, looksLikeEmail, normalizeIndianMobile } from "./phone";

test("normalizeIndianMobile accepts common Indian formats", () => {
  assert.equal(normalizeIndianMobile("9876543210"), "+919876543210");
  assert.equal(normalizeIndianMobile("+91 98765 43210"), "+919876543210");
  assert.equal(normalizeIndianMobile("91-98765-43210"), "+919876543210");
  assert.equal(normalizeIndianMobile("098765 43210"), "+919876543210");
  assert.equal(normalizeIndianMobile("(+91) 6123456789"), "+916123456789");
});

test("normalizeIndianMobile rejects landlines and wrong lengths", () => {
  assert.equal(normalizeIndianMobile("5876543210"), null);
  assert.equal(normalizeIndianMobile("987654321"), null);
  assert.equal(normalizeIndianMobile("98765432101"), null);
  assert.equal(normalizeIndianMobile("+1 9876543210"), null);
  assert.equal(isIndianMobile("abc"), false);
});

test("looksLikeEmail", () => {
  assert.equal(looksLikeEmail("a@b.in"), true);
  assert.equal(looksLikeEmail(" a@b.co "), true);
  assert.equal(looksLikeEmail("a@b"), false);
  assert.equal(looksLikeEmail("a b@c.com"), false);
});

test("parseShopFilter falls back to all", () => {
  assert.equal(parseShopFilter(undefined), "all");
  assert.equal(parseShopFilter("GEMS"), "gems");
  assert.equal(parseShopFilter(["rudraksha", "x"]), "rudraksha");
  assert.equal(parseShopFilter("unknown"), "all");
});

test("filterProducts by category", () => {
  assert.equal(filterProducts(PRODUCTS, "all").length, PRODUCTS.length);
  const gems = filterProducts(PRODUCTS, "gems");
  assert.ok(gems.length > 0);
  assert.ok(gems.every((p) => p.category === "GEM"));
  assert.ok(filterProducts(PRODUCTS, "vastu").every((p) => p.category === "VASTU"));
  assert.equal(filterProducts([], "yantra").length, 0);
});

test("filterForCategory is the inverse of the filter map", () => {
  assert.equal(filterForCategory("GEM"), "gems");
  assert.equal(filterForCategory("RUDRAKSHA"), "rudraksha");
  assert.equal(filterForCategory("YANTRA"), "yantra");
  assert.equal(filterForCategory("VASTU"), "vastu");
});

test("relatedProducts: same category first, never the product itself, limited", () => {
  const pukhraj = getProduct("yellow-sapphire-pukhraj")!;
  const rel = relatedProducts(pukhraj, PRODUCTS, 4);
  assert.equal(rel.length, 4);
  assert.ok(!rel.some((p) => p.slug === pukhraj.slug));
  const firstNonGem = rel.findIndex((p) => p.category !== "GEM");
  if (firstNonGem !== -1) assert.ok(rel.slice(firstNonGem).every((p) => p.category !== "GEM"));
  const yantra = getProduct("shri-yantra")!;
  assert.equal(relatedProducts(yantra, PRODUCTS, 3).length, 3);
});

test("consultProblemFor maps to existing booking problems", () => {
  assert.equal(consultProblemFor("GEM"), "gemstone");
  assert.equal(consultProblemFor("RUDRAKSHA"), "gemstone");
  assert.equal(consultProblemFor("VASTU"), "vastu-residential");
  assert.equal(consultProblemFor("YANTRA"), "dosha");
});

test("productTint follows the stone colour, then the category", () => {
  assert.equal(productTint({ slug: "blue-sapphire-neelam", category: "GEM" }).hue, "#60A5FA");
  assert.equal(productTint({ slug: "something-new", category: "VASTU" }).hue, "#A78BFA");
});

test("enquiry schema validates and reports per field", () => {
  const ok = enquirySchema.safeParse({ productSlug: "ruby-manik", name: "Amit", phone: "9876543210" });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.locale, "hi");
  assert.deepEqual(enquiryFieldErrors({ productSlug: "ruby-manik", name: "A", phone: "123" }), { name: true, phone: true });
  assert.deepEqual(enquiryFieldErrors({ productSlug: "ruby-manik", name: "Amit", phone: "+919876543210", note: "x".repeat(1001) }), {
    note: true,
  });
});
