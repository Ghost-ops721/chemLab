import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";

/** Student: goals assigned to any class they're in. */
export async function GET(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ goalIds: [], classes: [] });
  }

  const db = getAdminDb();
  const memberships = await db
    .collection("classMembers")
    .where("uid", "==", auth.uid)
    .limit(40)
    .get();

  const goalIds = new Set<string>();
  const classes: { id: string; name: string; goalIds: string[] }[] = [];

  for (const m of memberships.docs) {
    const classId = String(m.data().classId);
    const snap = await db.collection("classes").doc(classId).get();
    if (!snap.exists) continue;
    const data = snap.data()!;
    const ids = Array.isArray(data.goalIds) ? (data.goalIds as string[]) : [];
    for (const id of ids) goalIds.add(id);
    classes.push({
      id: snap.id,
      name: String(data.name ?? "Class"),
      goalIds: ids,
    });
  }

  return NextResponse.json({
    goalIds: Array.from(goalIds),
    classes,
  });
}
