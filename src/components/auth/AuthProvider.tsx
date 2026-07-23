"use client";

import { useEffect } from "react";
import { subscribeAuth } from "@/lib/firebase/auth";
import { ensureUserProfile } from "@/lib/firebase/profile";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const resetGuestProgress = useAuthStore((s) => s.resetGuestProgress);
  const closeAuthGate = useAuthStore((s) => s.closeAuthGate);

  useEffect(() => {
    let cancelled = false;
    const unsub = subscribeAuth(async (user) => {
      if (cancelled) return;
      setUser(user);
      if (!user) {
        setProfile(null);
        setAuthReady(true);
        return;
      }

      try {
        const progress = useProgressStore.getState();
        const badgeIds = progress.badges
          .filter((b) => b.earnedAt)
          .map((b) => b.id);
        // Prefer peeking pending signup without clearing — signUp may still need it
        const pending =
          useAuthStore.getState().pendingSignup ??
          (user.displayName
            ? { displayName: user.displayName, phone: "" }
            : null);
        const profile = await ensureUserProfile(
          user.uid,
          user.email ?? "",
          {
            xp: progress.xp,
            discoveredIds: progress.discoveredIds,
            badgeIds,
          },
          pending?.displayName || pending?.phone
            ? {
                displayName: pending.displayName || "",
                phone: pending.phone || "",
              }
            : undefined,
        );
        if (cancelled) return;
        // Don't clobber a richer profile already set by signUp
        const current = useAuthStore.getState().profile;
        if (
          current &&
          current.updatedAt >= profile.updatedAt &&
          (current.displayName || current.phone)
        ) {
          // keep current; still merge cloud scoring if needed
        } else {
          setProfile(profile);
        }
        const finalProfile = useAuthStore.getState().profile ?? profile;
        useProgressStore.getState().hydrateFromCloud({
          xp: finalProfile.xp,
          discoveredIds: finalProfile.discoveredIds,
          badgeIds: finalProfile.badgeIds,
          stars: finalProfile.stars,
          lastDailyStarAt: finalProfile.lastDailyStarAt,
          unlockedShopItemIds: finalProfile.unlockedShopItemIds,
          completedPerfumeIds: finalProfile.completedPerfumeIds,
        });
        // Hydrate inventions shelf from Admin progress GET
        try {
          const { getAuthHeaders } = await import("@/lib/client/authHeaders");
          const headers = await getAuthHeaders();
          if (headers) {
            const res = await fetch("/api/progress", { headers });
            if (res.ok) {
              const data = (await res.json()) as { inventions?: unknown[] };
              if (Array.isArray(data.inventions) && data.inventions.length) {
                const { useInventionStore } = await import(
                  "@/store/inventionStore"
                );
                useInventionStore
                  .getState()
                  .hydrateInventions(data.inventions as never[]);
              }
            }
          }
        } catch {
          /* best-effort inventions hydrate */
        }
        // Push any local/guest progress through Admin-validated API
        const local = useProgressStore.getState();
        const localBadges = local.badges
          .filter((b) => b.earnedAt)
          .map((b) => b.id);
        if (
          local.xp > 0 ||
          local.discoveredIds.length > 0 ||
          localBadges.length > 0 ||
          local.completedPerfumeIds.length > 0
        ) {
          const { syncProgressToFirestore } = await import(
            "@/lib/firebase/profile"
          );
          void syncProgressToFirestore(user.uid, {
            xp: local.xp,
            discoveredIds: local.discoveredIds,
            badgeIds: localBadges,
            completedPerfumeIds: local.completedPerfumeIds,
          }).catch(() => {
            /* best-effort */
          });
        }
        // Push local inventions
        try {
          const { useInventionStore } = await import("@/store/inventionStore");
          const { syncInventionsToFirestore } = await import(
            "@/lib/firebase/inventionsSync"
          );
          const inv = useInventionStore.getState().inventions;
          if (inv.length > 0) {
            void syncInventionsToFirestore(user.uid, inv).catch(() => {});
          }
        } catch {
          /* ignore */
        }
        resetGuestProgress();
        closeAuthGate();
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [setUser, setProfile, setAuthReady, resetGuestProgress, closeAuthGate]);

  return <>{children}</>;
}
