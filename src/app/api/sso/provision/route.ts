import { NextResponse } from "next/server";
import { z } from "zod";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";
import {
  getOrgMembership,
  memberDocId,
} from "@/lib/server/orgs/orgHelpers";
import { FieldValue } from "firebase-admin/firestore";

/**
 * After Google sign-in, client may call this with the email domain.
 * If an org has sso.domain matching, auto-join as student.
 */
const bodySchema = z.object({
  email: z.string().email(),
  provider: z.literal("google").default("google"),
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const domain = parsed.data.email.split("@")[1]?.toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const db = getAdminDb();
  const orgs = await db.collection("orgs").get();
  const match = orgs.docs.find((d) => {
    const sso = d.data().sso as { provider?: string; domain?: string } | undefined;
    return (
      sso?.provider === "google" &&
      typeof sso.domain === "string" &&
      sso.domain.toLowerCase() === domain
    );
  });

  if (!match) {
    return NextResponse.json({ matched: false });
  }

  const orgId = match.id;
  const existing = await getOrgMembership(auth.uid);
  if (existing.some((m) => m.orgId === orgId)) {
    return NextResponse.json({ matched: true, orgId, already: true });
  }

  await db
    .collection("orgMembers")
    .doc(memberDocId(orgId, auth.uid))
    .set({
      orgId,
      uid: auth.uid,
      role: "student",
      joinedAt: Date.now(),
      externalId: parsed.data.email.toLowerCase(),
    });

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

  return NextResponse.json({ matched: true, orgId });
}
