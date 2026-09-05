"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // In local dev, a stale SW caches `/` and breaks the App Router
    // ("Router action dispatched before initialization").
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if ("caches" in window) {
            return caches.keys().then((keys) =>
              Promise.all(keys.map((k) => caches.delete(k)))
            );
          }
        })
        .catch(() => {});
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
