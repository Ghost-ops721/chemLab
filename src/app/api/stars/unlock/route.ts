import { getAdminDb } from "@/lib/server/firebaseAdmin";
import {
  enforceRateLimit,
  requireFirebaseUser,
} from "@/lib/server/requireAuth";
import {
  MAX_STARS,
  VALID_SHOP_ITEM_IDS,
} from "@/lib/server/progressValidate";
import { getStarShopItem } from "@/domains/chemistry/perfume/starCatalog";

export const maxDuration = 15;

export async function POST(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const limited = enforceRateLimit(req, auth.uid, "stars-unlock");
  if (limited) return limited.response;

  let body: { itemId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const itemId = body.itemId;
  if (!itemId || !VALID_SHOP_ITEM_IDS.has(itemId)) {
    return Response.json(
      { ok: false, error: "Unknown shop item", stars: 0, unlockedShopItemIds: [] },
      { status: 400 },
    );
  }

  const item = getStarShopItem(itemId)!;
  const ref = getAdminDb().collection("users").doc(auth.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    return Response.json(
      { ok: false, error: "Profile not found", stars: 0, unlockedShopItemIds: [] },
      { status: 404 },
    );
  }

  const data = snap.data() ?? {};
  const stars = typeof data.stars === "number" ? data.stars : 0;
  const unlocked: string[] = Array.isArray(data.unlockedShopItemIds)
    ? (data.unlockedShopItemIds as string[])
    : [];

  if (unlocked.includes(itemId)) {
    return Response.json({
      ok: true,
      stars,
      unlockedShopItemIds: unlocked,
      itemId,
      error: "Already unlocked",
    });
  }

  if (stars < item.price) {
    return Response.json(
      {
        ok: false,
        error: `Need ${item.price}★ (you have ${stars}★)`,
        stars,
        unlockedShopItemIds: unlocked,
      },
      { status: 400 },
    );
  }

  const nextStars = Math.min(MAX_STARS, stars - item.price);
  const nextUnlocked = [...unlocked, itemId];
  const now = Date.now();
  await ref.update({
    stars: nextStars,
    unlockedShopItemIds: nextUnlocked,
    updatedAt: now,
    lastSeenAt: now,
  });

  return Response.json({
    ok: true,
    stars: nextStars,
    unlockedShopItemIds: nextUnlocked,
    itemId,
  });
}

export async function GET(req: Request) {
  const auth = await requireFirebaseUser(req);
  if ("response" in auth) return auth.response;

  const snap = await getAdminDb().collection("users").doc(auth.uid).get();
  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const data = snap.data() ?? {};
  return Response.json({
    stars: data.stars ?? 0,
    unlockedShopItemIds: data.unlockedShopItemIds ?? [],
  });
}
