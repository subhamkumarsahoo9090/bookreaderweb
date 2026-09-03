"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { authApi, libraryApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function SettingsContent() {
  const { token, user, setUser } = useAuth();
  const [msg, setMsg] = useState("");
  const [lang, setLang] = useState(user?.settings?.preferredLanguage || "hi");
  const [spacing, setSpacing] = useState(user?.settings?.lineSpacing || 1.6);
  const [dyslexia, setDyslexia] = useState(
    Boolean(user?.settings?.dyslexiaFont)
  );

  async function saveAccess() {
    if (!token) return;
    const res = await authApi.updateSettings(token, {
      dyslexiaFont: dyslexia,
      lineSpacing: spacing,
      preferredLanguage: lang,
    });
    setUser(res.user);
    globalThis.document.documentElement.classList.toggle("dyslexia", dyslexia);
    globalThis.document.documentElement.style.setProperty(
      "--reader-line-height",
      String(spacing)
    );
    setMsg("Accessibility settings saved");
  }

  async function exportType(type: "all" | "notes" | "vocab" | "documents") {
    if (!token) return;
    const res = await libraryApi.exportMarkdown(token, type);
    const blob = new Blob([res.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
    setMsg(`Exported ${res.filename}`);
  }

  return (
    <div className="page-shell">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Settings
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Accessibility, export, and reading preferences. Your data syncs with
        your account on every device.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--moss)]">{msg}</p>}

      <section className="mt-8 rounded-2xl border border-[var(--line)] p-5">
        <h2 className="font-medium">Dyslexia-friendly reading</h2>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={dyslexia}
            onChange={(e) => setDyslexia(e.target.checked)}
          />
          Use dyslexia-friendly font
        </label>
        <label className="mt-3 block text-sm text-[var(--muted)]">
          Line spacing ({spacing.toFixed(1)})
          <input
            type="range"
            min={1.2}
            max={2.4}
            step={0.1}
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            className="mt-1 block w-full"
          />
        </label>
        <label className="mt-3 block text-sm text-[var(--muted)]">
          Preferred translate language
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-[var(--line)] px-3 py-2"
          >
            <option value="hi">Hindi</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="bn">Bengali</option>
            <option value="ta">Tamil</option>
          </select>
        </label>
        <button
          type="button"
          onClick={saveAccess}
          className="mt-4 rounded-xl bg-[var(--moss)] px-4 py-2 text-sm text-white"
        >
          Save
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] p-5">
        <h2 className="font-medium">Export</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Download Markdown (open in Notion / Obsidian). Use print for PDF.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "notes", "vocab", "documents"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => exportType(t)}
              className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm capitalize"
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)]"
          >
            Print / PDF
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] p-5">
        <h2 className="font-medium">Offline (PWA)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Install this app from your browser menu (“Add to Home Screen” /
          Install) for commute reading. Cached pages work offline after first
          visit.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Streak: {user?.streak?.current || 0} current ·{" "}
          {user?.streak?.longest || 0} best
        </p>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
