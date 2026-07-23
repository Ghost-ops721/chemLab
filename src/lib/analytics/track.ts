"use client";

import { getAuthHeaders } from "@/lib/client/authHeaders";
import type { AnalyticsEventName } from "@/lib/analytics/events";

const ANON_KEY = "chemlab-anon-id";

function getAnonId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `anon-${Date.now()}`;
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

/** Best-effort product analytics. Never throws. */
export function track(
  name: AnalyticsEventName,
  props?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  void (async () => {
    try {
      const headers = (await getAuthHeaders()) ?? {
        "Content-Type": "application/json",
      };
      await fetch("/api/analytics", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          path: window.location.pathname,
          anonId: getAnonId(),
          props: props ?? {},
        }),
        keepalive: true,
      });
    } catch {
      /* ignore */
    }
  })();
}
