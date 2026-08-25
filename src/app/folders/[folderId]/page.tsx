"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { documentsApi, foldersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DocumentMeta, Folder } from "@/lib/types";

function FolderDetailContent() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [foldersRes, docsRes] = await Promise.all([
        foldersApi.list(token),
        documentsApi.list(token, folderId),
      ]);
      const found = foldersRes.folders.find((f) => f._id === folderId) || null;
      setFolder(found);
      setDocuments(docsRes.documents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, [token, folderId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!token || !file || !title.trim()) return;
    setUploading(true);
    setError("");
    setProgress("Uploading and running OCR… this can take a minute.");
    try {
      const res = await documentsApi.process(token, {
        file,
        folderId,
        title: title.trim(),
      });
      setTitle("");
      setFile(null);
      setProgress("");
      router.push(`/documents/${res.document._id}`);
    } catch (err) {
      setProgress("");
      setError(
        err instanceof Error
          ? err.name === "AbortError"
            ? "Upload timed out — try a smaller file."
            : err.message
          : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  async function onDeleteDoc(id: string, docTitle: string) {
    if (!token) return;
    if (!confirm(`Delete “${docTitle}”?`)) return;
    try {
      await documentsApi.remove(token, id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-shell-wide">
      <Link
        href="/folders"
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← All folders
      </Link>
      <h1 className="animate-fade-up mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        {folder?.name || "Folder"}
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Upload an image or PDF — only extracted text is stored.
      </p>

      <form
        onSubmit={onUpload}
        className="animate-fade-up-delay mt-8 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/70 p-5"
      >
        <h2 className="font-medium text-[var(--ink)]">Upload document</h2>
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--muted)]">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Chapter 1 scan"
            className="w-full rounded-xl border border-[var(--line)] bg-white/50 px-4 py-3 outline-none ring-[var(--moss)] focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--muted)]">
            File (jpeg, png, webp, gif, tiff, pdf — max ~15MB)
          </span>
          <input
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,image/gif,image/tiff,application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--wash)] file:px-3 file:py-2 file:text-[var(--ink)]"
          />
        </label>
        {progress && (
          <p className="animate-pulse text-sm text-[var(--moss)]">{progress}</p>
        )}
        {error && <p className="text-sm text-[var(--accent)]">{error}</p>}
        <button
          type="submit"
          disabled={uploading || !file}
          className="rounded-xl bg-[var(--moss)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {uploading ? "Processing…" : "Process & open reader"}
        </button>
      </form>

      <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
        Documents
      </h2>
      {documents.length === 0 ? (
        <p className="mt-4 text-[var(--muted)]">No documents in this folder yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--paper)]/60">
          {documents.map((doc) => (
            <li
              key={doc._id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/documents/${doc._id}`}
                  className="font-medium text-[var(--ink)] hover:text-[var(--moss)]"
                >
                  {doc.title}
                </Link>
                <p className="text-xs text-[var(--muted)]">
                  {doc.fileType.toUpperCase()} · {doc.wordCount} words ·{" "}
                  {new Date(doc.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/documents/${doc._id}`}
                  className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--line)]"
                >
                  Read
                </Link>
                <button
                  type="button"
                  onClick={() => onDeleteDoc(doc._id, doc.title)}
                  className="rounded-lg px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--wash)]"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FolderDetailPage() {
  return (
    <RequireAuth>
      <FolderDetailContent />
    </RequireAuth>
  );
}
