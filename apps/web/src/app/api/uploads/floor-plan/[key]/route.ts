import { readLocalUpload } from "@/lib/storage";

/** Dev-only viewer for locally stored floor plans; production files live in R2 behind signed URLs. */
export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/floor-plan/[key]">) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "not_found" }, { status: 404 });
  const { key } = await ctx.params;
  const file = await readLocalUpload(key);
  if (!file) return Response.json({ error: "not_found" }, { status: 404 });
  return new Response(Buffer.from(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
