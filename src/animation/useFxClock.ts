import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Re-renders on rAF while any one-shot FX window is still open.
 * Returns a monotonic "now" timestamp from the animation loop (0 before first frame).
 */
export function useFxClock(
  timestamps: Array<number | undefined>,
  windowMs = 2200,
) {
  const [now, setNow] = useState(0);

  const latest = timestamps.reduce<number>((max, t) => {
    if (t == null) return max;
    return Math.max(max, t);
  }, 0);

  useEffect(() => {
    if (!latest) return;
    const endsAt = latest + windowMs;
    let id = 0;
    let cancelled = false;

    const loop = () => {
      if (cancelled) return;
      const wall = Date.now();
      setNow(wall);
      if (wall < endsAt) id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [latest, windowMs]);

  // Before first rAF, treat a fresh timestamp as "now" so one-shots paint immediately
  return now || (latest ? latest + 1 : 0);
}

export function fxAlive(
  ts: number | undefined,
  ms: number,
  now: number,
) {
  if (!ts || !now) return false;
  return now - ts < ms;
}

function reducedMotionSubscribe(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    reducedMotionSubscribe,
    reducedMotionSnapshot,
    () => false,
  );
}
