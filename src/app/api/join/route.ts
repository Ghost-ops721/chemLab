import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";
import {
  classMemberDocId,
  memberDocId,
} from "@/lib/server/orgs/orgHelpers";
import { FieldValue } from "firebase-admin/firestore";

const bodySchema = z.object({
  code: z.string().trim().min(4).max(16),
});

export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();
  const db = getAdminDb();

  const classSnap = await db
    .collection("classes")
    .where("inviteCode", "==", code)
    .limit(1)
    .get();

  let orgId: string;
  let classId: string | null = null;

  if (!classSnap.empty) {
    const doc = classSnap.docs[0]!;
    classId = doc.id;
    orgId = String(doc.data().orgId);
  } else {
    const orgSnap = await db
      .collection("orgs")
      .where("inviteCode", "==", code)
      .limit(1)
      .get();
    if (orgSnap.empty) {
      return NextResponse.json({ error: "Invite code not found" }, { status: 404 });
    }
    orgId = orgSnap.docs[0]!.id;
  }

  const memberId = memberDocId(orgId, auth.uid);
  const memberRef = db.collection("orgMembers").doc(memberId);
  const existing = await memberRef.get();
  if (!existing.exists) {
    await memberRef.set({
      orgId,
      uid: auth.uid,
      role: "student",
      joinedAt: Date.now(),
    });
  }

  if (classId) {
    await db
      .collection("classMembers")
      .doc(classMemberDocId(classId, auth.uid))
      .set({
        classId,
        orgId,
        uid: auth.uid,
        joinedAt: Date.now(),
      });
  }

  await db
    .collection("users")
    .doc(auth.uid)
    .set(
      {
        orgIds: FieldValue.arrayUnion(orgId),
        updatedAt: Date.now(),
      },
      { merge: true },
    );

  return NextResponse.json({ ok: true, orgId, classId });
}
