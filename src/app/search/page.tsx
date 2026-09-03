"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { libraryApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DocumentMeta, Note, VocabularyEntry } from "@/lib/types";

function SearchContent() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [vocab, setVocab] = useState<VocabularyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!token || q.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await libraryApi.search(token, q.trim());
      setDocs(res.documents);
      setNotes(res.notes);
      setVocab(res.vocabulary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell-wide">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Search library
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Find across documents, notes, and vocabulary.
      </p>
      <form onSubmit={onSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--moss)] px-5 py-3 text-sm text-white"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <section>
          <h2 className="font-medium text-[var(--ink)]">Documents</h2>
          <ul className="mt-3 space-y-2">
            {docs.map((d) => (
              <li key={d._id}>
                <Link
                  href={`/documents/${d._id}`}
                  className="text-[var(--moss)] hover:underline"
                >
                  {d.title}
                </Link>
              </li>
            ))}
            {!docs.length && (
              <li className="text-sm text-[var(--muted)]">No matches</li>
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-medium text-[var(--ink)]">Notes</h2>
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li key={n._id} className="text-sm">
                <span className="font-medium">{n.title}</span>
                <p className="text-[var(--muted)] line-clamp-2">{n.content}</p>
              </li>
            ))}
            {!notes.length && (
              <li className="text-sm text-[var(--muted)]">No matches</li>
            )}
          </ul>
        </section>
        <section>
          <h2 className="font-medium text-[var(--ink)]">Vocabulary</h2>
          <ul className="mt-3 space-y-2">
            {vocab.map((v) => (
              <li key={v._id} className="text-sm">
                <span className="font-medium">{v.text || v.word}</span>
                <p className="text-[var(--muted)]">{v.definition}</p>
              </li>
            ))}
            {!vocab.length && (
              <li className="text-sm text-[var(--muted)]">No matches</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <RequireAuth>
      <SearchContent />
    </RequireAuth>
  );
}
