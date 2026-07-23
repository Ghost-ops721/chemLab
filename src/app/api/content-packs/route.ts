import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/server/requireAuth";
import { isFirebaseAdminConfigured } from "@/lib/server/firebaseAdmin";
import { getAllowedGoalIdsForUser } from "@/lib/server/orgs/contentPackAccess";
import {
  DEFAULT_CONTENT_PACKS,
  listContentPacks,
} from "@/domains/chemistry/contentPacks";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

export async function GET(req: Request) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || !isFirebaseAdminConfigured()) {
    return NextResponse.json({
      packIds: DEFAULT_CONTENT_PACKS,
      goalIds: "all" as const,
      perfumeAtelier: true,
      freeformPerfume: true,
      scan: true,
      catalog: listContentPacks(),
    });
  }

  const auth = await requireFirebaseUser(req);
  if ("response" in auth) {
    return NextResponse.json({
      packIds: DEFAULT_CONTENT_PACKS,
      goalIds: "all" as const,
      perfumeAtelier: true,
      freeformPerfume: true,
      scan: true,
      catalog: listContentPacks(),
    });
  }

  const access = await getAllowedGoalIdsForUser(auth.uid);
  return NextResponse.json({
    ...access,
    catalog: listContentPacks(),
  });
}

export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: { orgId?: string };
  try {
    body = (await req.json()) as { orgId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }
  const org = await getAdminDb().collection("orgs").doc(body.orgId).get();
  if (!org.exists) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }
  return NextResponse.json({
    orgId: body.orgId,
    contentPackIds: org.data()?.contentPackIds ?? DEFAULT_CONTENT_PACKS,
    catalog: listContentPacks(),
  });
}
