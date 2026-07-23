/**
 * Bootstrap a demo org + assign teacher by email (must already exist in users/).
 * Usage: npx tsx scripts/bootstrap-org.ts teacher@email.com
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function loadEnv() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

function serviceAccount(): ServiceAccount {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json) as ServiceAccount;
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials missing in .env.local");
  }
  return { projectId, clientEmail, privateKey };
}

function inviteCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function main() {
  const teacherEmail = (process.argv[2] || "").trim().toLowerCase();
  if (!teacherEmail) {
    console.error("Usage: npx tsx scripts/bootstrap-org.ts teacher@email.com");
    process.exit(1);
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount()) });
  }
  const db = getFirestore();
  const auth = getAuth();

  let uid: string;
  try {
    const user = await auth.getUserByEmail(teacherEmail);
    uid = user.uid;
  } catch {
    const users = await db
      .collection("users")
      .where("email", "==", teacherEmail)
      .limit(1)
      .get();
    if (users.empty) {
      console.error(
        `No Auth/Firestore user for ${teacherEmail}. Sign up in Chem Lab first.`,
      );
      process.exit(1);
    }
    uid = users.docs[0]!.id;
  }

  const orgCode = inviteCode();
  const classCode = inviteCode();
  const orgRef = await db.collection("orgs").add({
    name: "Demo School",
    slug: "demo-school",
    inviteCode: orgCode,
    createdAt: Date.now(),
    createdBy: uid,
    llmQuota: {
      explainPerDay: 200,
      ocrPerDay: 50,
      tokensPerDay: 500_000,
    },
    sso: null,
    contentPackIds: ["classic", "products", "perfume", "advanced"],
  });

  await db
    .collection("orgMembers")
    .doc(`${orgRef.id}_${uid}`)
    .set({
      orgId: orgRef.id,
      uid,
      role: "teacher",
      joinedAt: Date.now(),
    });

  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        orgIds: FieldValue.arrayUnion(orgRef.id),
        email: teacherEmail,
        updatedAt: Date.now(),
      },
      { merge: true },
    );

  const classRef = await db.collection("classes").add({
    orgId: orgRef.id,
    name: "Period 1 Chemistry",
    teacherUid: uid,
    inviteCode: classCode,
    goalIds: ["soap", "inspired-citruscologne"],
    createdAt: Date.now(),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        teacherEmail,
        uid,
        orgId: orgRef.id,
        orgInvite: orgCode,
        classId: classRef.id,
        classInvite: classCode,
        teacherUrl: "http://localhost:3000/teacher",
        joinUrl: `http://localhost:3000/join?code=${classCode}`,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
