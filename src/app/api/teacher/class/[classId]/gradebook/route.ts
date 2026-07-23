import { requireFirebaseUser } from "@/lib/server/requireAuth";
import {
  getAdminDb,
  isFirebaseAdminConfigured,
} from "@/lib/server/firebaseAdmin";

type Ctx = { params: Promise<{ classId: string }> };

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;
  if (!isFirebaseAdminConfigured()) {
    return Response.json({ error: "Unavailable" }, { status: 503 });
  }

  const { classId } = await ctx.params;
  const db = getAdminDb();
  const classSnap = await db.collection("classes").doc(classId).get();
  if (!classSnap.exists || classSnap.data()?.teacherUid !== auth.uid) {
    return Response.json({ error: "Not your class" }, { status: 403 });
  }

  const classData = classSnap.data()!;
  const goalIds = Array.isArray(classData.goalIds)
    ? (classData.goalIds as string[])
    : [];

  const members = await db
    .collection("classMembers")
    .where("classId", "==", classId)
    .get();

  const header = [
    "uid",
    "email",
    "displayName",
    "xp",
    "stars",
    "discoveries",
    "badges",
    "completedPerfumes",
    "inventions",
    "classGoalsDone",
    "classGoalsTotal",
    "lastSeenAt",
  ];

  const rows: string[] = [header.join(",")];

  for (const m of members.docs) {
    const uid = String(m.data().uid);
    const userSnap = await db.collection("users").doc(uid).get();
    const u = userSnap.data() ?? {};
    const completedGoals = new Set<string>([
      ...(Array.isArray(u.completedPerfumeIds) ? u.completedPerfumeIds : []),
      ...(Array.isArray(u.discoveredIds) ? u.discoveredIds : []),
    ]);
    // Also check completedGoalIds if stored later — use perfume + discovery overlap with assigned
    const classGoalsDone = goalIds.filter((id) => completedGoals.has(id)).length;

    rows.push(
      [
        uid,
        u.email ?? m.data().email ?? "",
        u.displayName ?? m.data().displayName ?? "",
        u.xp ?? 0,
        u.stars ?? 0,
        Array.isArray(u.discoveredIds) ? u.discoveredIds.length : 0,
        Array.isArray(u.badgeIds) ? u.badgeIds.length : 0,
        Array.isArray(u.completedPerfumeIds) ? u.completedPerfumeIds.length : 0,
        Array.isArray(u.inventions) ? u.inventions.length : 0,
        classGoalsDone,
        goalIds.length,
        u.lastSeenAt ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const filename = `gradebook-${String(classData.name || classId)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .toLowerCase()}.csv`;

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
