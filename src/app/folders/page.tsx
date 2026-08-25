"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { foldersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Folder } from "@/lib/types";

function FoldersContent() {
  const { token } = useAuth();
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
      <div className="animate-fade-up flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            Folders
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Organize scanned chapters and reading material.
          </p>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="animate-fade-up-delay mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New folder name"
          required
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none ring-[var(--moss)] focus:ring-2"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-[var(--moss)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create folder"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      ) : folders.length === 0 ? (
        <p className="mt-12 text-center text-[var(--muted)]">
          No folders yet. Create one to start uploading.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder, i) => (
            <li
              key={folder._id}
              className="animate-fade-up group rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4 transition hover:border-[var(--moss)]/40"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              {renamingId === folder._id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="rounded-lg border border-[var(--line)] px-3 py-2 outline-none ring-[var(--moss)] focus:ring-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onRename(folder._id)}
                      className="rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--wash)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href={`/folders/${folder._id}`}
                    className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] hover:text-[var(--moss)]"
                  >
                    {folder.name}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(folder._id);
                        setRenameValue(folder.name);
                      }}
                      className="rounded-lg px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--wash)]"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(folder._id, folder.name)}
                      className="rounded-lg px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--wash)]"
                    >
                      Delete
                    </button>
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
