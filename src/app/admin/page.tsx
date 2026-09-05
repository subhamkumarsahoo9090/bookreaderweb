"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RequireAdmin } from "@/components/RequireAuth";
import { sharedLibraryApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { SharedBookMeta } from "@/lib/types";
import { OCR_LANG_OPTIONS } from "@/lib/types";

function AdminContent() {
  const { token } = useAuth();
  const [books, setBooks] = useState<SharedBookMeta[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [ocrLang, setOcrLang] = useState("auto");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await sharedLibraryApi.adminList(token);
      setBooks(res.books);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!token || !file || !title.trim()) return;
    setUploading(true);
    setError("");
    setMsg("");
    try {
      await sharedLibraryApi.adminUpload(token, {
        file,
        title: title.trim(),
        description,
        category,
        ocrLang,
        published: true,
      });
      setTitle("");
      setDescription("");
      setFile(null);
      setMsg("Book uploaded and published");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function togglePublish(book: SharedBookMeta) {
    if (!token) return;
    await sharedLibraryApi.adminUpdate(token, book._id, {
      published: !book.published,
    });
    await load();
  }

  async function onDelete(id: string, name: string) {
    if (!token) return;
    if (!confirm(`Delete “${name}”?`)) return;
    await sharedLibraryApi.adminDelete(token, id);
    await load();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <h1 className="page-title">Admin</h1>
      <p className="page-subtitle">
        Upload educational books for the shared AksharaX library.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--moss)]">{msg}</p>}
      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      <form onSubmit={onUpload} className="ui-panel mt-8 space-y-4 p-5">
        <h2 className="font-semibold">Upload shared book</h2>
        <label className="block">
          <span className="ui-label">Title</span>
          <input
            className="ui-input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="ui-label">Description</span>
          <textarea
            className="ui-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="ui-label">Category</span>
            <input
              className="ui-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="ui-label">OCR language</span>
            <select
              className="ui-input"
              value={ocrLang}
              onChange={(e) => setOcrLang(e.target.value)}
            >
              {OCR_LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="ui-label">File (PDF, DOCX, TXT, image…)</span>
          <input
            type="file"
            required
            accept=".pdf,.txt,.docx,.rtf,.epub,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={uploading || !file}
          className="ui-btn ui-btn-primary"
        >
          {uploading ? "Processing…" : "Upload & publish"}
        </button>
      </form>

      <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl">
        Catalog
      </h2>
      <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
        {books.map((b) => (
          <li
            key={b._id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{b.title}</p>
              <p className="text-xs text-[var(--muted)]">
                {b.category} · {b.wordCount} words ·{" "}
                {b.published ? "Published" : "Draft"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => togglePublish(b)}
                className="ui-btn ui-btn-ghost !py-1.5 text-sm"
              >
                {b.published ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(b._id, b.title)}
                className="ui-btn ui-btn-ghost !py-1.5 text-sm text-[var(--accent)]"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {books.length === 0 && (
          <li className="px-4 py-6 text-sm text-[var(--muted)]">
            No shared books yet.
          </li>
        )}
      </ul>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminContent />
    </RequireAdmin>
  );
}
