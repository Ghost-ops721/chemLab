import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";

type Ctx = { params: Promise<{ classId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { classId } = await ctx.params;
  const db = getAdminDb();
  const classSnap = await db.collection("classes").doc(classId).get();
  if (!classSnap.exists) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  const classData = classSnap.data()!;
  if (classData.teacherUid !== auth.uid) {
    return NextResponse.json({ error: "Not your class" }, { status: 403 });
  }

  const members = await db
    .collection("classMembers")
    .where("classId", "==", classId)
    .get();

  const students = [];
  for (const m of members.docs) {
    const uid = String(m.data().uid);
    const userSnap = await db.collection("users").doc(uid).get();
    const u = userSnap.data() ?? {};
    students.push({
      uid,
      email: u.email ?? "",
      displayName: u.displayName ?? "",
      xp: u.xp ?? 0,
      stars: u.stars ?? 0,
      discoveries: Array.isArray(u.discoveredIds) ? u.discoveredIds.length : 0,
      completedPerfumes: Array.isArray(u.completedPerfumeIds)
        ? u.completedPerfumeIds.length
        : 0,
      inventions: Array.isArray(u.inventions) ? u.inventions.length : 0,
    });
  }

  return NextResponse.json({
    class: { id: classSnap.id, ...classData },
    students,
  });
}
