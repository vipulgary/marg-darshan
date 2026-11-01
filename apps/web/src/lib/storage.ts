/**
 * File storage for uploads (floor plans). Production target is Cloudflare R2;
 * until that lands, dev saves to apps/web/.uploads.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class StorageNotConfiguredError extends Error {
  constructor(message = "storage not configured") {
    super(message);
    this.name = "StorageNotConfiguredError";
  }
}

const KEY_RE = /^[0-9a-f-]{36}\.(pdf|jpg|png)$/;
const TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png" };

export const isR2Configured = () =>
  !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);

const localDir = () => path.join(process.cwd(), ".uploads");

export async function saveUpload({ bytes, ext }: { bytes: Uint8Array; ext: "pdf" | "jpg" | "png" }): Promise<{ key: string; url: string }> {
  if (isR2Configured()) {
    // TODO(AMX-075): PUT to R2 with a SigV4-signed request and return a signed GET url.
    throw new StorageNotConfiguredError("R2 upload is not configured yet");
  }
  const dir = localDir();
  await mkdir(dir, { recursive: true });
  // Keep dev uploads (personal data) out of git without touching the repo's .gitignore.
  await writeFile(path.join(dir, ".gitignore"), "*\n");
  const key = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, key), bytes);
  return { key, url: `/api/uploads/floor-plan/${key}` };
}

export async function readLocalUpload(key: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!KEY_RE.test(key)) return null;
  try {
    const bytes = await readFile(path.join(localDir(), key));
    return { bytes: new Uint8Array(bytes), contentType: TYPES[key.split(".").pop()!] };
  } catch {
    return null;
  }
}
