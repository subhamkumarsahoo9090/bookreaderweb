"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { foldersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Folder } from "@/lib/types";

function FoldersContent() {
  const { token, user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const res = await foldersApi.list(token);
      setFolders(res.folders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load folders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await foldersApi.create(token, name.trim());
      setFolders((prev) => [res.folder, ...prev]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create folder");
    } finally {
      setCreating(false);
    }
  }

  async function onRename(id: string) {
    if (!token || !renameValue.trim()) return;
    try {
      const res = await foldersApi.rename(token, id, renameValue.trim());
      setFolders((prev) => prev.map((f) => (f._id === id ? res.folder : f)));
      setRenamingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  }

  async function onDelete(id: string, folderName: string) {
    if (!token) return;
    if (!confirm(`Delete “${folderName}” and all its documents?`)) return;
    try {
      await foldersApi.remove(token, id);
      setFolders((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="page-shell-wide">
      <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--moss)]">
            Library
          </p>
          <h1 className="page-title mt-1">Folders</h1>
          <p className="page-subtitle">
            Welcome{user?.email ? `, ${user.email.split("@")[0]}` : ""}. Organize
            chapters, scans, and study material in one place.
          </p>
        </div>
        <span className="ui-chip w-fit">
          {folders.length} folder{folders.length === 1 ? "" : "s"}
        </span>
      </div>

      <form
        onSubmit={onCreate}
        className="animate-fade-up-delay ui-panel mt-8 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-2 sm:pl-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New folder name — e.g. Chapter 1"
          required
          className="ui-input flex-1 !border-0 !bg-transparent !px-1 !shadow-none focus:!shadow-none sm:!py-2"
        />
        <button type="submit" disabled={creating} className="ui-btn ui-btn-primary shrink-0">
          {creating ? "Creating…" : "Create folder"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm font-medium text-[var(--accent)]">{error}</p>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--moss)] border-t-transparent" />
        </div>
      ) : folders.length === 0 ? (
        <div className="ui-panel mt-10 px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Your library is empty
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create a folder above, then upload PDF, images, or audio.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder, i) => (
            <li
              key={folder._id}
              className="animate-fade-up group ui-panel relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--moss)_35%,var(--line))]"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--moss)] to-[var(--accent)] opacity-80"
                aria-hidden
              />
              {renamingId === folder._id ? (
                <div className="flex flex-col gap-2 pt-1">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="ui-input"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onRename(folder._id)}
                      className="ui-btn ui-btn-primary !py-1.5"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="ui-btn ui-btn-ghost !py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href={`/folders/${folder._id}`}
                    className="block pt-1 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] transition hover:text-[var(--moss)]"
                  >
                    {folder.name}
                  </Link>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Created {new Date(folder.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-5 flex gap-2 border-t border-[var(--line)] pt-3 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(folder._id);
                        setRenameValue(folder.name);
                      }}
                      className="ui-btn ui-btn-ghost !px-2 !py-1 text-xs"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(folder._id, folder.name)}
                      className="ui-btn ui-btn-ghost !px-2 !py-1 text-xs !text-[var(--accent)]"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/folders/${folder._id}`}
                      className="ui-btn ui-btn-secondary ml-auto !px-3 !py-1 text-xs"
                    >
                      Open
                    </Link>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FoldersPage() {
  return (
    <RequireAuth>
      <FoldersContent />
    </RequireAuth>
  );
}
