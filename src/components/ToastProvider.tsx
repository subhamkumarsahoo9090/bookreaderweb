"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
  duration: number;
};

type ConfirmState = {
  id: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (ok: boolean) => void;
};

type ToastApi = {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  confirm: (
    message: string,
    opts?: { confirmLabel?: string; cancelLabel?: string }
  ) => Promise<boolean>;
};

const ToastContext = createContext<ToastApi | null>(null);

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `t-${Date.now()}-${idCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, duration = 3500) => {
      const id = nextId();
      setToasts((prev) => [...prev.slice(-4), { id, kind, message, duration }]);
      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, duration) => push("success", message, duration),
      error: (message, duration) => push("error", message, duration ?? 4500),
      info: (message, duration) => push("info", message, duration),
      confirm: (message, opts) =>
        new Promise<boolean>((resolve) => {
          setConfirmState({
            id: nextId(),
            message,
            confirmLabel: opts?.confirmLabel || "Delete",
            cancelLabel: opts?.cancelLabel || "Cancel",
            resolve,
          });
        }),
    }),
    [push]
  );

  function closeConfirm(ok: boolean) {
    if (!confirmState) return;
    confirmState.resolve(ok);
    setConfirmState(null);
  }

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-lg)] animate-fade-up ${
              t.kind === "success"
                ? "border-[color-mix(in_srgb,var(--moss)_35%,var(--line))] bg-[var(--paper)] text-[var(--ink)]"
                : t.kind === "error"
                  ? "border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] bg-[var(--paper)] text-[var(--ink)]"
                  : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
            }`}
            role="status"
          >
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                t.kind === "success"
                  ? "bg-[var(--moss)]"
                  : t.kind === "error"
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--muted)]"
              }`}
              aria-hidden
            />
            <p className="flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-[var(--muted)] hover:text-[var(--ink)]"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {confirmState && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => closeConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`confirm-title-${confirmState.id}`}
            className="ui-panel w-full max-w-sm animate-fade-up p-5 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={`confirm-title-${confirmState.id}`}
              className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]"
            >
              Please confirm
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {confirmState.message}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-primary"
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
