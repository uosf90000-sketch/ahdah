import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { InvalidRequestBodyError, readJsonObjectWithLimit, RequestBodyTooLargeError } from "@/lib/request-body";
import { ensureRuntimeSchema } from "@/lib/runtime-schema";

export const dynamic = "force-dynamic";
const noStore = { "cache-control": "private, no-store" };
const MAX_BODY_BYTES = 8 * 1024;
const allowedPlatforms = new Set(["ios", "android"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });

  try {
    const body = await readJsonObjectWithLimit(request, MAX_BODY_BYTES);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const platform = typeof body.platform === "string" ? body.platform.trim().toLowerCase() : "";
    if (token.length < 20 || token.length > 4096 || !allowedPlatforms.has(platform)) {
      return Response.json({ error: "بيانات الجهاز غير صالحة" }, { status: 400, headers: noStore });
    }

    await ensureRuntimeSchema();
    await db.pushDevice.upsert({
      where: { token },
      create: { token, platform, userId: user.id },
      update: { platform, userId: user.id },
    });
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return Response.json({ error: "الطلب أكبر من الحد المسموح" }, { status: 413, headers: noStore });
    if (error instanceof InvalidRequestBodyError) return Response.json({ error: "بيانات الطلب غير صالحة" }, { status: 400, headers: noStore });
    console.error("push device registration failed", error);
    return Response.json({ error: "تعذر تسجيل الجهاز للإشعارات" }, { status: 500, headers: noStore });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "غير مصرح" }, { status: 401, headers: noStore });

  try {
    const body = await readJsonObjectWithLimit(request, MAX_BODY_BYTES);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) return Response.json({ error: "رمز الجهاز مطلوب" }, { status: 400, headers: noStore });
    await ensureRuntimeSchema();
    await db.pushDevice.deleteMany({ where: { token, userId: user.id } });
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return Response.json({ error: "الطلب أكبر من الحد المسموح" }, { status: 413, headers: noStore });
    if (error instanceof InvalidRequestBodyError) return Response.json({ error: "بيانات الطلب غير صالحة" }, { status: 400, headers: noStore });
    console.error("push device unregister failed", error);
    return Response.json({ error: "تعذر إلغاء تسجيل الجهاز" }, { status: 500, headers: noStore });
  }
}
