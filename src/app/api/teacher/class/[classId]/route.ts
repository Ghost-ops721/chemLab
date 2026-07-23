import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";

type Ctx = { params: Promise<{ classId: string }> };

const patchSchema = z.object({
  goalIds: z.array(z.string().min(1)).max(40),
  name: z.string().trim().min(1).max(120).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { classId } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getAdminDb();
  const classSnap = await db.collection("classes").doc(classId).get();
  if (!classSnap.exists || classSnap.data()?.teacherUid !== auth.uid) {
    return NextResponse.json({ error: "Not your class" }, { status: 403 });
  }

  const update: Record<string, unknown> = {
    goalIds: parsed.data.goalIds,
    updatedAt: Date.now(),
  };
  if (parsed.data.name) update.name = parsed.data.name;

  await db.collection("classes").doc(classId).set(update, { merge: true });
  return NextResponse.json({ ok: true, goalIds: parsed.data.goalIds });
}
