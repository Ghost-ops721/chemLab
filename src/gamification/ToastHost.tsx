"use client";

import { useEffect, useState } from "react";

export interface ToastPayload {
  id: string;
  title: string;
  detail?: string;
}

let pushToastExternal: ((t: Omit<ToastPayload, "id">) => void) | null = null;

export function showToast(t: Omit<ToastPayload, "id">) {
  pushToastExternal?.(t);
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    pushToastExternal = (t) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...t, id }].slice(-3));
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 3200);
    };
    return () => {
      pushToastExternal = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-64 flex-col gap-1.5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-enter rounded-lg border border-lab-teal/30 bg-lab-ink/95 px-3 py-2 text-lab-foam shadow-2xl backdrop-blur"
        >
          <p className="font-display text-xs text-lab-foam">{t.title}</p>
          {t.detail ? (
            <p className="mt-px text-[11px] text-lab-foam/70">{t.detail}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
