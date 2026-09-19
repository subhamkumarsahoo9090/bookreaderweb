"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { documentsApi, foldersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ToastProvider";
import type { DocumentMeta, Folder } from "@/lib/types";
import { OCR_LANG_OPTIONS } from "@/lib/types";

function FolderDetailContent() {
  const { token } = useAuth();
  const toast = useToast();
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [path, setPath] = useState<{ _id: string; name: string }[]>([]);
  const [children, setChildren] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [subfolderName, setSubfolderName] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ocrLang, setOcrLang] = useState("auto");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creatingSub, setCreatingSub] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [folderRes, docsRes] = await Promise.all([
        foldersApi.get(token, folderId),
        documentsApi.list(token, folderId),
      ]);
      setFolder(folderRes.folder);
      setPath(folderRes.path || []);
      setChildren(folderRes.children || []);
      setDocuments(docsRes.documents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, [token, folderId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function onCreateSubfolder(e: FormEvent) {
    e.preventDefault();
    if (!token || !subfolderName.trim()) return;
    setCreatingSub(true);
    setError("");
    try {
      const res = await foldersApi.create(
        token,
        subfolderName.trim(),
        folderId
      );
      setChildren((prev) => [res.folder, ...prev]);
      setSubfolderName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create subfolder"
      );
    } finally {
      setCreatingSub(false);
    }
  }

  async function onDeleteSubfolder(id: string, name: string) {
    if (!token) return;
    const ok = await toast.confirm(
      `Delete “${name}” and everything inside it?`,
      { confirmLabel: "Delete" }
    );
    if (!ok) return;
    try {
      await foldersApi.remove(token, id);
      setChildren((prev) => prev.filter((f) => f._id !== id));
      toast.success("Subfolder deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
      toast.error(msg);
    }
  }

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!token || !file || !title.trim()) return;
    setUploading(true);
    setError("");
    setProgress("Uploading and processing… this can take a minute.");
    try {
      const isAudio =
        file.type.startsWith("audio/") ||
        /\.(mp3|wav|webm|ogg|m4a)$/i.test(file.name);

      if (isAudio) {
        setProgress("Transcribing audio with Whisper…");
        const { transcribeAudio } = await import("@/lib/api");
        const transcript = await transcribeAudio(file);
        const res = await documentsApi.createFromText(token, {
          folderId,
          title: title.trim(),
          extractedText: transcript.text,
          fileType: "audio",
        });
        setTitle("");
        setFile(null);
        setProgress("");
        router.push(`/documents/${res.document._id}`);
        return;
      }

      const res = await documentsApi.process(token, {
        file,
        folderId,
        title: title.trim(),
        ocrLang,
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
    const ok = await toast.confirm(`Delete “${docTitle}”?`, {
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await documentsApi.remove(token, id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      toast.success("Document deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      setError(msg);
      toast.error(msg);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  const parentHref =
    folder?.parentId != null
      ? `/folders/${folder.parentId}`
      : "/folders";

  return (
    <div className="page-shell-wide">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--muted)]">
        <Link href="/folders" className="hover:text-[var(--ink)]">
          Folders
        </Link>
        {path.map((crumb) => (
          <span key={crumb._id} className="contents">
            <span aria-hidden>/</span>
            <Link
              href={`/folders/${crumb._id}`}
              className={
                crumb._id === folderId
                  ? "font-medium text-[var(--ink)]"
                  : "hover:text-[var(--ink)]"
              }
            >
              {crumb.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {folder?.name || "Folder"}
          </h1>
      <p className="mt-1 text-[var(--muted)]">
        Add subfolders or upload documents here. For Odia/Hindi scans, pick the
        matching OCR language (not Auto) for best full-page reading.
      </p>
        </div>
        <Link
          href={parentHref}
          className="text-sm text-[var(--moss)] hover:underline"
        >
          ← Up one level
        </Link>
      </div>

      {error && (
        <p className="mt-4 text-sm font-medium text-[var(--accent)]">{error}</p>
      )}

      <section className="animate-fade-up-delay mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Subfolders
        </h2>
        <form
          onSubmit={onCreateSubfolder}
          className="ui-panel mt-3 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-2 sm:pl-4"
        >
          <input
            value={subfolderName}
            onChange={(e) => setSubfolderName(e.target.value)}
            placeholder="New subfolder name — e.g. Chapter 1"
            required
            className="ui-input flex-1 !border-0 !bg-transparent !px-1 !shadow-none focus:!shadow-none sm:!py-2"
          />
          <button
            type="submit"
            disabled={creatingSub}
            className="ui-btn ui-btn-primary shrink-0"
          >
            {creatingSub ? "Creating…" : "Create subfolder"}
          </button>
        </form>

        {children.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No subfolders yet. Create one above to nest material.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <li key={child._id} className="ui-panel flex flex-col p-4">
                <Link
                  href={`/folders/${child._id}`}
                  className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)] hover:text-[var(--moss)]"
                >
                  {child.name}
                </Link>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/folders/${child._id}`}
                    className="ui-btn ui-btn-secondary !px-3 !py-1 text-xs"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDeleteSubfolder(child._id, child.name)}
                    className="ui-btn ui-btn-ghost !px-2 !py-1 text-xs !text-[var(--accent)]"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        onSubmit={onUpload}
        className="animate-fade-up-delay mt-10 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/70 p-5"
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
            OCR / document language
          </span>
          <select
            value={ocrLang}
            onChange={(e) => setOcrLang(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white/50 px-4 py-3 outline-none ring-[var(--moss)] focus:ring-2"
          >
            {OCR_LANG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-[var(--muted)]">
            File (images, PDF, TXT, DOCX, RTF, EPUB, audio mp3/wav/m4a — max ~15MB)
          </span>
          <input
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,image/gif,image/tiff,application/pdf,.pdf,.txt,text/plain,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.rtf,application/rtf,.epub,application/epub+zip,audio/*,.mp3,.wav,.m4a,.webm,.ogg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--wash)] file:px-3 file:py-2 file:text-[var(--ink)]"
          />
        </label>
        {progress && (
          <p className="animate-pulse text-sm text-[var(--moss)]">{progress}</p>
        )}
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
