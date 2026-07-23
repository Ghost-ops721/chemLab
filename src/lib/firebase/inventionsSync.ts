import type { Invention } from "@/domains/chemistry/invention";
import { getAuthHeaders } from "@/lib/client/authHeaders";

export async function syncInventionsToFirestore(
  _uid: string,
  inventions: Invention[],
  starsDelta = 0,
): Promise<{ stars?: number; starsGranted?: number } | void> {
  if (typeof window === "undefined") {
    throw new Error("syncInventionsToFirestore must be called from the client");
  }
  const headers = await getAuthHeaders();
  if (!headers) return;
  const res = await fetch("/api/progress", {
    method: "POST",
    headers,
    body: JSON.stringify({
      inventions,
      inventionsOnly: true,
      ...(starsDelta > 0 ? { starsDelta } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Invention sync failed (${res.status})`);
  }
  try {
    return (await res.json()) as { stars?: number; starsGranted?: number };
  } catch {
    return;
  }
}
