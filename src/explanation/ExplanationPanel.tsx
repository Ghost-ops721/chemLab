"use client";

import { useEffect, useState } from "react";
import type { EngineResult } from "@/types";
import { getFallbackExplanation } from "@/domains/chemistry/data/explanations";
import { useDeskStore } from "@/store/deskStore";
import { useProgressStore } from "@/store/progressStore";

async function streamExplanation(
  result: EngineResult,
  reactants: string[],
): Promise<string> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  if (!res.ok || !res.body) {
    throw new Error("explain failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text.trim();
}

export function ExplanationPanel() {
  const vessels = useDeskStore((s) => s.vessels);
  const lastId = useDeskStore((s) => s.lastExplanationVesselId);
  const vessel = vessels.find((v) => v.instanceId === lastId);
  const result = vessel?.lastResult;

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

  useEffect(() => {
    if (!discoveryId || !result) return;
    if (cached) return;

    let cancelled = false;

    streamExplanation(result, vessel?.contentIds ?? [])
      .then((t) => {
        if (cancelled) return;
        const next = t || getFallbackExplanation(result.explanationKey);
        const source: "tutor" | "fallback" = t ? "tutor" : "fallback";
        setLive({ id: discoveryId, text: next, source });
        setCache(discoveryId, next);
        setExpanded(true);
      })
      .catch(() => {
        if (cancelled) return;
        const next = getFallbackExplanation(result.explanationKey);
        setLive({ id: discoveryId, text: next, source: "fallback" });
        setCache(discoveryId, next);
        setExpanded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [discoveryId, result, vessel?.contentIds, cached, setCache]);

  const text = cached ?? (live && live.id === discoveryId ? live.text : "");
  const source = cached
    ? ("saved" as const)
    : live && live.id === discoveryId
      ? live.source
      : null;
  const waiting = Boolean(result && discoveryId && !text);

  async function retry() {
    if (!result || !discoveryId) return;
    setRetrying(true);
    try {
      const t = await streamExplanation(result, vessel?.contentIds ?? []);
      const next = t || getFallbackExplanation(result.explanationKey);
      setLive({ id: discoveryId, text: next, source: t ? "tutor" : "fallback" });
      setCache(discoveryId, next);
    } catch {
      const next = getFallbackExplanation(result.explanationKey);
      setLive({ id: discoveryId, text: next, source: "fallback" });
      setCache(discoveryId, next);
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
        onClick={() => setExpanded((v) => !v)}
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
        {!result ? (
          <div className="rounded-lg bg-lab-wash/70 px-2 py-2 text-lab-muted">
            <p>
              After you mix, this panel explains the chemistry in plain language
              — faithful to the balanced equation on the vessel.
            </p>
          </div>
        ) : waiting ? (
          <p className="animate-pulse text-lab-muted">Consulting the lab tutor…</p>
        ) : (
          <>
            {result.label ? (
              <p className="equation-pop mb-2 rounded-lg bg-lab-ink px-2 py-1.5 font-mono text-[11px] leading-snug text-lab-foam">
                {result.label}
              </p>
            ) : null}
            {!result.ok ? (
              <p className="mb-2 rounded-md bg-red-100 px-2 py-1 text-[11px] font-semibold text-lab-hazard">
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
            <p className="whitespace-pre-wrap">{text}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void retry()}
                disabled={retrying}
                className="rounded-md border border-lab-line px-2 py-1 text-[10px] font-semibold text-lab-teal hover:bg-lab-wash disabled:opacity-50"
              >
                {retrying ? "…" : "Explain again"}
              </button>
              {source ? (
                <p className="text-[9px] uppercase tracking-wider text-lab-muted">
                  {source === "tutor"
                    ? "Lab tutor"
                    : source === "saved"
                      ? "Saved"
                      : "Offline notes"}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
