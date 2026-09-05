"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { authApi, libraryApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { FontFamilyId } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/types";

function SettingsInner() {
  const { token, user, setUser, loginWithToken } = useAuth();
  const params = useSearchParams();
  const [msg, setMsg] = useState("");
  const [lang, setLang] = useState(user?.settings?.preferredLanguage || "hi");
  const [spacing, setSpacing] = useState(user?.settings?.lineSpacing || 1.6);
  const [dyslexia, setDyslexia] = useState(
    Boolean(user?.settings?.dyslexiaFont)
  );
  const [readingFont, setReadingFont] = useState<FontFamilyId>(
    user?.settings?.readingFontFamily || "fraunces"
  );
  const [editorFont, setEditorFont] = useState<FontFamilyId>(
    user?.settings?.editorFontFamily || "outfit"
  );
  const [fontSize, setFontSize] = useState(user?.settings?.fontSize || 18);
  const [driveConnected, setDriveConnected] = useState(
    Boolean(user?.driveConnected)
  );
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [driveBusy, setDriveBusy] = useState(false);

  useEffect(() => {
    const driveToken = params.get("token");
    const driveFlag = params.get("drive");
    if (driveFlag === "connected" && driveToken) {
      loginWithToken(driveToken)
        .then(() => setMsg("Google Drive connected"))
        .catch(() => setMsg("Drive connect finished — refresh if needed"));
    }
  }, [params, loginWithToken]);

  useEffect(() => {
    if (!token) return;
    authApi
      .driveStatus(token)
      .then((res) => {
        setDriveConnected(res.connected);
        setGoogleConfigured(res.googleConfigured);
      })
      .catch(() => setGoogleConfigured(false));
  }, [token, user?.driveConnected]);

  async function saveAccess() {
    if (!token) return;
    const res = await authApi.updateSettings(token, {
      dyslexiaFont: dyslexia,
      lineSpacing: spacing,
      preferredLanguage: lang,
      readingFontFamily: readingFont,
      editorFontFamily: editorFont,
      fontSize,
    });
    setUser(res.user);
    globalThis.document.documentElement.classList.toggle("dyslexia", dyslexia);
    globalThis.document.documentElement.style.setProperty(
      "--reader-line-height",
      String(spacing)
    );
    setMsg("Settings saved");
  }

  async function connectDrive() {
    setDriveBusy(true);
    try {
      const res = await authApi.googleStart("drive");
      window.location.href = res.url;
    } catch (err) {
      setMsg(
        err instanceof ApiError && err.status === 503
          ? "Google Drive is not configured on the server."
          : err instanceof Error
            ? err.message
            : "Could not start Drive connect"
      );
      setDriveBusy(false);
    }
  }

  async function disconnectDrive() {
    if (!token) return;
    setDriveBusy(true);
    try {
      await authApi.disconnectDrive(token);
      setDriveConnected(false);
      const me = await authApi.me(token);
      setUser(me.user);
      setMsg("Google Drive disconnected");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setDriveBusy(false);
    }
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
        Accessibility, fonts, Google Drive, and export.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--moss)]">{msg}</p>}

      <section className="mt-8 rounded-2xl border border-[var(--line)] p-5">
        <h2 className="font-medium">Google Drive</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Store new documents in your own Drive under an AksharaX folder. MongoDB
          keeps only light metadata when Drive is connected.
        </p>
        {!googleConfigured ? (
          <p className="mt-3 text-sm text-[var(--accent)]">
            Google OAuth is not configured on the server yet.
          </p>
        ) : driveConnected ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="ui-chip">Connected</span>
            <button
              type="button"
              disabled={driveBusy}
              onClick={disconnectDrive}
              className="ui-btn ui-btn-ghost !py-1.5 text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={driveBusy}
            onClick={connectDrive}
            className="ui-btn ui-btn-primary mt-3"
          >
            {driveBusy ? "Opening…" : "Connect Google Drive"}
          </button>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] p-5">
        <h2 className="font-medium">Reading & editing fonts</h2>
        <label className="mt-3 block text-sm text-[var(--muted)]">
          Reading font
          <select
            value={readingFont}
            onChange={(e) => setReadingFont(e.target.value as FontFamilyId)}
            className="mt-1 block w-full rounded-lg border border-[var(--line)] px-3 py-2"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm text-[var(--muted)]">
          Editor font
          <select
            value={editorFont}
            onChange={(e) => setEditorFont(e.target.value as FontFamilyId)}
            className="mt-1 block w-full rounded-lg border border-[var(--line)] px-3 py-2"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm text-[var(--muted)]">
          Font size ({fontSize}px)
          <input
            type="range"
            min={12}
            max={32}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="mt-1 block w-full"
          />
        </label>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] p-5">
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
            <option value="or">Odia</option>
            <option value="en">English</option>
            <option value="bn">Bengali</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="mr">Marathi</option>
            <option value="gu">Gujarati</option>
            <option value="kn">Kannada</option>
            <option value="ml">Malayalam</option>
            <option value="pa">Punjabi</option>
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
          Install this app from your browser menu for commute reading.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Streak: {user?.streak?.current || 0} current ·{" "}
          {user?.streak?.longest || 0} best
          {user?.role === "admin" ? " · Admin" : ""}
        </p>
      </section>
    </div>
  );
}

function SettingsContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
