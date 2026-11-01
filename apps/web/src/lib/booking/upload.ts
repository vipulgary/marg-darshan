/** Floor-plan upload rules (AMX-075): PDF / JPG / PNG up to 10 MB, checked by magic bytes. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export type UploadKind = { ext: "pdf" | "jpg" | "png"; contentType: string };

const startsWith = (bytes: Uint8Array, sig: number[]) => bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b);

/** Identify the file from its first bytes; the browser-supplied MIME type is not trusted. */
export function sniffUploadType(bytes: Uint8Array): UploadKind | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { ext: "pdf", contentType: "application/pdf" }; // %PDF-
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { ext: "jpg", contentType: "image/jpeg" };
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: "png", contentType: "image/png" };
  return null;
}

/** Client-side pre-check (the server re-validates). */
export function precheckUpload(file: { size: number; type: string; name: string }): "tooLarge" | "badType" | null {
  if (file.size > MAX_UPLOAD_BYTES) return "tooLarge";
  const okType = ["application/pdf", "image/jpeg", "image/png"].includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  return okType ? null : "badType";
}
