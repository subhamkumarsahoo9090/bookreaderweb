"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { notesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Note } from "@/lib/types";

function NotesContent() {
  const { token } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notesApi.list(token);
      setNotes(res.notes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token || !title.trim() || !content.trim()) return;
    setCreating(true);
    try {
      const res = await notesApi.create(token, {
        title: title.trim(),
        content: content.trim(),
      });
      setNotes((prev) => [res.note, ...prev]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create note");
    } finally {
      setCreating(false);
    }
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!token || !editing) return;
    try {
      const res = await notesApi.update(token, editing._id, {
        title: editing.title,
        content: editing.content,
      });
      setNotes((prev) => prev.map((n) => (n._id === res.note._id ? res.note : n)));
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onDelete(id: string) {
    if (!token || !confirm("Delete this note?")) return;
    await notesApi.remove(token, id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  }

  return (
    <div className="page-shell-wide">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        Notes
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Separate from vocabulary — jot ideas linked to reading or standalone.
      </p>

      <form onSubmit={onCreate} className="mt-8 space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/70 p-5">
        <h2 className="font-medium">New note</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Title"
          className="w-full rounded-xl border border-[var(--line)] px-4 py-3"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          placeholder="Write your note…"
          className="w-full rounded-xl border border-[var(--line)] px-4 py-3"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-[var(--moss)] px-5 py-3 text-sm text-white disabled:opacity-60"
        >
          {creating ? "Saving…" : "Create note"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      ) : notes.length === 0 ? (
        <p className="mt-12 text-center text-[var(--muted)]">No notes yet.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {notes.map((note) => (
            <li
              key={note._id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4"
            >
              {editing?._id === note._id ? (
                <form onSubmit={onUpdate} className="space-y-2">
                  <input
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
                  />
                  <textarea
                    value={editing.content}
                    onChange={(e) =>
                      setEditing({ ...editing, content: e.target.value })
                    }
                    rows={4}
                    className="w-full rounded-lg border border-[var(--line)] px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="font-[family-name:var(--font-display)] text-xl">
                    {note.title}
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
                    {note.content}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {note.documentId ? (
                      <>
                        Linked to{" "}
                        <Link
                          href={`/documents/${note.documentId}`}
                          className="text-[var(--moss)] underline"
                        >
                          document
                        </Link>
                      </>
                    ) : (
                      "Standalone"
                    )}{" "}
                    · {new Date(note.updatedAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(note)}
                      className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(note._id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-[var(--accent)]"
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

export default function NotesPage() {
  return (
    <RequireAuth>
      <NotesContent />
    </RequireAuth>
  );
}
