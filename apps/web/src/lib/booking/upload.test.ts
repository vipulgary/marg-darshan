import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_UPLOAD_BYTES, precheckUpload, sniffUploadType } from "./upload";

const bytes = (...b: number[]) => new Uint8Array(b);

test("magic bytes identify pdf / jpg / png", () => {
  assert.equal(sniffUploadType(new TextEncoder().encode("%PDF-1.7\n"))?.ext, "pdf");
  assert.equal(sniffUploadType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10))?.ext, "jpg");
  assert.equal(sniffUploadType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.contentType, "image/png");
});

test("renamed or truncated files are rejected", () => {
  assert.equal(sniffUploadType(new TextEncoder().encode("<svg xmlns=...>")), null);
  assert.equal(sniffUploadType(bytes(0x25, 0x50)), null);
  assert.equal(sniffUploadType(bytes()), null);
  assert.equal(sniffUploadType(bytes(0x4d, 0x5a, 0x90, 0)), null); // a Windows executable
});

test("client pre-check", () => {
  assert.equal(precheckUpload({ size: 1000, type: "application/pdf", name: "plan.pdf" }), null);
  assert.equal(precheckUpload({ size: 1000, type: "", name: "plan.JPG" }), null);
  assert.equal(precheckUpload({ size: MAX_UPLOAD_BYTES + 1, type: "image/png", name: "a.png" }), "tooLarge");
  assert.equal(precheckUpload({ size: 10, type: "image/gif", name: "a.gif" }), "badType");
});
