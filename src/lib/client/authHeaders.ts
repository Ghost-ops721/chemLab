"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

/** Returns Authorization header with Firebase ID token, or null if signed out. */
export async function getAuthHeaders(): Promise<
  Record<string, string> | null
> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
