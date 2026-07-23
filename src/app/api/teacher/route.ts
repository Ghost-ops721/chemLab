import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";
import {
  getOrgMembership,
  randomInviteCode,
} from "@/lib/server/orgs/orgHelpers";

export async function GET(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const memberships = await getOrgMembership(auth.uid);
  const teacherOrgs = memberships.filter((m) => m.role === "teacher");
  if (!teacherOrgs.length) {
    return NextResponse.json({ teacher: false, classes: [], orgs: [] });
  }

  const db = getAdminDb();
  const orgIds = teacherOrgs.map((m) => m.orgId);
  const classes: Record<string, unknown>[] = [];
  for (const orgId of orgIds) {
    const snap = await db
      .collection("classes")
      .where("orgId", "==", orgId)
      .where("teacherUid", "==", auth.uid)
      .get();
    for (const d of snap.docs) {
      classes.push({ id: d.id, ...d.data() });
    }
  }

  const orgs = [];
  for (const orgId of orgIds) {
    const snap = await db.collection("orgs").doc(orgId).get();
    if (snap.exists) orgs.push({ id: snap.id, ...snap.data() });
  }

  return NextResponse.json({ teacher: true, classes, orgs });
}

const createSchema = z.object({
  orgId: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  goalIds: z.array(z.string()).max(40).optional(),
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
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const memberships = await getOrgMembership(auth.uid);
  const ok = memberships.some(
    (m) => m.orgId === parsed.data.orgId && m.role === "teacher",
  );
  if (!ok) {
    return NextResponse.json({ error: "Not a teacher for this org" }, { status: 403 });
  }

  const inviteCode = randomInviteCode();
  const ref = await getAdminDb().collection("classes").add({
    orgId: parsed.data.orgId,
    name: parsed.data.name,
    teacherUid: auth.uid,
    inviteCode,
    goalIds: parsed.data.goalIds ?? [],
    createdAt: Date.now(),
  });

  return NextResponse.json({
    id: ref.id,
    inviteCode,
    orgId: parsed.data.orgId,
    name: parsed.data.name,
  });
}
