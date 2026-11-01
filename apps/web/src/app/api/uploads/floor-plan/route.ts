import { MAX_UPLOAD_BYTES, sniffUploadType } from "@/lib/booking/upload";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { StorageNotConfiguredError, saveUpload } from "@/lib/storage";

/** POST multipart (field "file"): PDF / JPG / PNG ≤ 10 MB → { url } */
export async function POST(req: Request) {
  const rl = rateLimit(`upload:${clientIp(req)}`, 10, 60 * 60_000);
  if (!rl.ok)
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });

  // Reject obviously oversized bodies before buffering them.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return Response.json({ error: "too_large" }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return Response.json({ error: "invalid_form" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "file_missing" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "too_large" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffUploadType(bytes);
  if (!kind) return Response.json({ error: "bad_type" }, { status: 415 });

  try {
    const { url } = await saveUpload({ bytes, ext: kind.ext });
    return Response.json({ url, contentType: kind.contentType, size: bytes.length }, { status: 201 });
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) return Response.json({ error: "storage_unavailable", message: e.message }, { status: 503 });
    console.error("floor-plan upload failed", e);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
