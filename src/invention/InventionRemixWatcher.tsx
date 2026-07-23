"use client";

import { useEffect, useRef } from "react";
import { useDeskStore } from "@/store/deskStore";
import { useInventionStore } from "@/store/inventionStore";
import { showToast } from "@/gamification/ToastHost";

/**
 * When remixing a shelf invention outside a goal, save a new version
 * after a successful Mix.
 */
export function InventionRemixWatcher() {
  const remixInventionId = useInventionStore((s) => s.remixInventionId);
  const addVersionFromVessel = useInventionStore((s) => s.addVersionFromVessel);
  const vessels = useDeskStore((s) => s.vessels);
  const activeVesselId = useDeskStore((s) => s.activeVesselId);
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    if (!remixInventionId) {
      lastHandled.current = null;
      return;
    }
    const vessel =
      vessels.find((v) => v.instanceId === activeVesselId) ??
      vessels.find((v) => v.lastResult) ??
      null;
    if (!vessel?.lastResult?.ok) return;
    const key = `${remixInventionId}:${vessel.lastResult.discoveryId}:${vessel.fx.mixAt ?? 0}`;
    if (lastHandled.current === key) return;
    lastHandled.current = key;

    const result = addVersionFromVessel(remixInventionId, vessel);
    if (!result) return;
    if (result.improved) {
      showToast({
        title: `Improved! ${result.version.score}`,
        detail: result.starsGained
          ? `+${result.starsGained}★ — you beat your best`
          : `v${result.version.version} on your Shelf`,
      });
    } else {
      showToast({
        title: `Saved v${result.version.version}`,
        detail: `Score ${result.version.score} — keep refining`,
      });
    }
  }, [
    remixInventionId,
    vessels,
    activeVesselId,
    addVersionFromVessel,
  ]);

  return null;
}
