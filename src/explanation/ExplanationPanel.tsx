"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { EngineResult } from "@/types";
import { getFallbackExplanation } from "@/domains/chemistry/data/explanations";
import {
  isPerfumeExplanationKey,
  recipeIdFromExplanationKey,
} from "@/domains/chemistry/engine/perfumeCraft";
import { resolveScentProfile } from "@/domains/chemistry/perfume";
import { FormulaInspector } from "@/perfume/FormulaInspector";
import { ScentProfileDetails } from "@/perfume/ScentProfileDetails";
import { useDeskStore } from "@/store/deskStore";
import { useProgressStore } from "@/store/progressStore";
import { useAuthStore } from "@/store/authStore";
import { getAuthHeaders } from "@/lib/client/authHeaders";
import { labCopy } from "@/lab/labCopy";
import { track } from "@/lib/analytics/track";

type StreamError = "auth" | "rate" | "other";

async function streamExplanation(
  result: EngineResult,
  reactants: string[],
  onChunk?: (text: string) => void,
): Promise<{ text: string; error?: StreamError }> {
  const headers = await getAuthHeaders();
  if (!headers) {
    return { text: "", error: "auth" };
  }

  const res = await fetch("/api/explain", {
    method: "POST",
    headers,
    body: JSON.stringify({
      discoveryId: result.discoveryId,
      label: result.label,
      explanationKey: result.explanationKey,
      effects: result.effects,
      reactants,
      products: result.products.map((p) => ({ id: p.id, name: p.name })),
      ok: result.ok,
    }),
  });

  if (res.status === 401) return { text: "", error: "auth" };
  if (res.status === 429) return { text: "", error: "rate" };

  if (!res.ok || !res.body) {
    return { text: "", error: "other" };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk?.(text.trim());
  }
  return { text: text.trim() };
}

export function ExplanationPanel() {
  const vessels = useDeskStore((s) => s.vessels);
  const lastId = useDeskStore((s) => s.lastExplanationVesselId);
  const activeId = useDeskStore((s) => s.activeVesselId);
  const vessel =
    vessels.find((v) => v.instanceId === lastId) ??
    vessels.find((v) => v.instanceId === activeId) ??
    vessels[0];
  const result = lastId
    ? vessels.find((v) => v.instanceId === lastId)?.lastResult
    : vessel?.lastResult;
  const livePreview = vessel?.livePreview;
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);

  const cache = useProgressStore((s) => s.explanationCache);
  const setCache = useProgressStore((s) => s.setExplanationCache);

  const discoveryId = result?.discoveryId;
  const cached = discoveryId ? cache[discoveryId] : undefined;

  const [live, setLive] = useState<{
    id: string;
    text: string;
    source: "tutor" | "fallback";
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const scentProfile = useMemo(() => {
    if (!result?.ok || !isPerfumeExplanationKey(result.explanationKey)) {
      return null;
    }
    const recipeId = recipeIdFromExplanationKey(result.explanationKey);
    const productId = result.products[0]?.id;
    return resolveScentProfile({
      perfumeRecipeId: recipeId,
      productChemicalId: productId,
      goalId: productId === "cologne" ? "perfume" : undefined,
      contentIds: vessel?.contentIds,
      displayName: result.products[0]?.name,
    });
  }, [result, vessel?.contentIds]);

  useEffect(() => {
    if (!discoveryId || !result || !authReady) return;
    if (cached) return;
    if (!user) return;

    let cancelled = false;

    streamExplanation(result, vessel?.contentIds ?? [], (chunk) => {
      if (cancelled) return;
      setLive({ id: discoveryId, text: chunk, source: "tutor" });
      setExpanded(true);
      setBanner(null);
    })
      .then(({ text: t, error }) => {
        if (cancelled) return;
        if (error === "auth") {
          const next = getFallbackExplanation(result.explanationKey);
          setLive({ id: discoveryId, text: next, source: "fallback" });
          setCache(discoveryId, next);
          setBanner(labCopy.tutorSignIn);
          setExpanded(true);
          return;
        }
        if (error === "rate") {
          const next = getFallbackExplanation(result.explanationKey);
          setLive({ id: discoveryId, text: next, source: "fallback" });
          setCache(discoveryId, next);
          setBanner(labCopy.tutorRateLimited);
          setExpanded(true);
          return;
        }
        const next = t || getFallbackExplanation(result.explanationKey);
        const source: "tutor" | "fallback" = t ? "tutor" : "fallback";
        setLive({ id: discoveryId, text: next, source });
        setCache(discoveryId, next);
        setBanner(null);
        setExpanded(true);
      })
      .catch(() => {
        if (cancelled) return;
        const next = getFallbackExplanation(result.explanationKey);
        setLive({ id: discoveryId, text: next, source: "fallback" });
        setCache(discoveryId, next);
        setBanner(labCopy.tutorOffline);
        setExpanded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [
    discoveryId,
    result,
    vessel?.contentIds,
    cached,
    setCache,
    user,
    authReady,
  ]);

  const guestText =
    !user && authReady && result
      ? getFallbackExplanation(result.explanationKey)
      : "";
  const text =
    cached ??
    ((live && live.id === discoveryId ? live.text : "") || guestText);
  const source = cached
    ? ("saved" as const)
    : live && live.id === discoveryId
      ? live.source
      : guestText
        ? ("fallback" as const)
        : null;
  const waiting = Boolean(
    result && discoveryId && authReady && user && !text,
  );
  const showSignInBanner = Boolean(result && authReady && !user);

  async function retry() {
    if (!result || !discoveryId) return;
    if (!user) {
      setBanner(labCopy.tutorSignIn);
      return;
    }
    setRetrying(true);
    setBanner(null);
    try {
      const { text: t, error } = await streamExplanation(
        result,
        vessel?.contentIds ?? [],
        (chunk) => {
          setLive({ id: discoveryId, text: chunk, source: "tutor" });
        },
      );
      if (error === "auth") {
        const next = getFallbackExplanation(result.explanationKey);
        setLive({ id: discoveryId, text: next, source: "fallback" });
        setCache(discoveryId, next);
        setBanner(labCopy.tutorSignIn);
        return;
      }
      if (error === "rate") {
        const next = getFallbackExplanation(result.explanationKey);
        setLive({ id: discoveryId, text: next, source: "fallback" });
        setCache(discoveryId, next);
        setBanner(labCopy.tutorRateLimited);
        return;
      }
      const next = t || getFallbackExplanation(result.explanationKey);
      setLive({
        id: discoveryId,
        text: next,
        source: t ? "tutor" : "fallback",
      });
      setCache(discoveryId, next);
    } catch {
      const next = getFallbackExplanation(result.explanationKey);
      setLive({ id: discoveryId, text: next, source: "fallback" });
      setCache(discoveryId, next);
      setBanner(labCopy.tutorOffline);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <aside
      className={`panel-glass flex w-full shrink-0 flex-col md:h-full md:w-[13.5rem] xl:w-[15rem] md:border-l md:border-lab-line/60 ${
        expanded ? "max-h-[50vh] md:max-h-none" : "max-h-28 md:max-h-none"
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between border-b border-lab-line/50 px-2.5 py-2 text-left md:pointer-events-none"
        onClick={() => {
          setExpanded((v) => {
            if (!v) track("tutor_open");
            return !v;
          });
        }}
      >
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-lab-teal">
            Lab tutor
          </p>
          <h2 className="mt-0.5 font-display text-base leading-tight text-lab-ink">
            What happened
          </h2>
        </div>
        <span className="text-lab-muted md:hidden">{expanded ? "▾" : "▴"}</span>
      </button>
      <div
        className={`scroll-thin flex-1 overflow-y-auto px-2.5 py-2 text-xs leading-snug text-lab-ink/90 ${
          expanded ? "" : "hidden md:block"
        }`}
      >
        {!result && !livePreview ? (
          <div className="rounded-lg bg-lab-wash/70 px-2 py-2 text-lab-muted">
            <p>
              Pour oils and ethanol, then adjust amounts — this panel tells you
              honestly what the blend would smell like and flags hazards live.
            </p>
            {!user && authReady ? (
              <p className="mt-2 text-[11px] text-lab-teal">
                <Link href="/login" className="font-semibold underline">
                  Sign in
                </Link>{" "}
                to unlock the live lab tutor after Mix.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            {livePreview ? <FormulaInspector preview={livePreview} /> : null}
            {!result ? (
              <p className="text-[11px] text-lab-muted">
                Mix when ready to lock the reaction / perfume craft.
              </p>
            ) : waiting ? (
          <p className="text-lab-muted motion-safe:animate-pulse">
            Consulting the lab tutor…
          </p>
        ) : (
          <>
            {banner || showSignInBanner ? (
              <p className="mb-2 rounded-md bg-lab-wash px-2 py-1.5 text-[11px] text-lab-muted">
                {banner ?? labCopy.tutorSignIn}{" "}
                {(banner === labCopy.tutorSignIn || showSignInBanner) ? (
                  <Link
                    href="/login"
                    className="font-semibold text-lab-teal underline"
                  >
                    Log in
                  </Link>
                ) : null}
              </p>
            ) : null}
            {result.label ? (
              <p className="equation-pop mb-2 rounded-lg bg-lab-ink px-2 py-1.5 font-mono text-[11px] leading-snug text-lab-foam">
                {result.label}
              </p>
            ) : null}
            {!result.ok ? (
              <p className="mb-2 rounded-md bg-lab-hazard/15 px-2 py-1 text-[11px] font-semibold text-lab-hazard">
                Safe-fail — combination blocked
              </p>
            ) : null}
            {result.products.length > 0 ? (
              <p className="mb-2 text-[11px] text-lab-muted">
                Products:{" "}
                <span className="text-lab-ink">
                  {result.products.map((p) => p.name).join(", ")}
                </span>
              </p>
            ) : null}
            {scentProfile ? (
              <div className="mb-2">
                <ScentProfileDetails profile={scentProfile} compact />
              </div>
            ) : null}
            <p className="whitespace-pre-wrap">{text}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void retry()}
                disabled={retrying || !user}
                className="rounded-md border border-lab-line px-2 py-1 text-[10px] font-semibold text-lab-teal hover:bg-lab-wash disabled:opacity-50"
              >
                {retrying ? "…" : "Explain again"}
              </button>
              {source ? (
                <p className="text-[9px] uppercase tracking-wider text-lab-muted">
                  {source === "tutor"
                    ? labCopy.tutorLive
                    : source === "saved"
                      ? labCopy.tutorSaved
                      : labCopy.tutorOffline}
                </p>
              ) : null}
            </div>
          </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
