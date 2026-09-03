"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/RequireAuth";
import { documentsApi, vocabularyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DocumentMeta, VocabularyEntry } from "@/lib/types";

type Filter = "all" | "linked" | "standalone";

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function displayText(entry: VocabularyEntry) {
  return entry.text || entry.word;
}

function VocabularyContent() {
  const { token } = useAuth();
  const [words, setWords] = useState<VocabularyEntry[]>([]);
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const opts =
        filter === "standalone"
          ? { standalone: true }
          : filter === "linked"
            ? { linked: true }
            : undefined;
      const [vocabRes, docsRes] = await Promise.all([
        vocabularyApi.list(token, opts),
        documentsApi.list(token),
      ]);
      setWords(vocabRes.vocabulary);
      setDocs(docsRes.documents);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vocabulary");
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function onRemove(id: string) {
    if (!token) return;
    await vocabularyApi.remove(token, id);
    setWords((prev) => prev.filter((w) => w._id !== id));
  }

  async function makeStandalone(id: string) {
    if (!token) return;
    const res = await vocabularyApi.update(token, id, { standalone: true });
    setWords((prev) => prev.map((w) => (w._id === id ? res.vocabulary : w)));
  }

  async function moveToDoc(id: string, documentId: string) {
    if (!token) return;
    const res = await vocabularyApi.update(token, id, { documentId });
    setWords((prev) => prev.map((w) => (w._id === id ? res.vocabulary : w)));
  }

  return (
    <div className="page-shell-wide">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        Vocabulary
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Words, phrases, and sentences — linked to a file or saved separately.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "linked", "standalone"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
              filter === f
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "bg-[var(--wash)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      ) : words.length === 0 ? (
        <p className="mt-12 text-center text-[var(--muted)]">
          No saved items yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {words.map((entry) => (
            <li
              key={entry._id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[var(--moss)]">
                    {entry.type || "word"}
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                    {displayText(entry)}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => speak(displayText(entry))}
                    className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
                  >
                    Speak
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry._id)}
                    className="rounded-lg px-3 py-1.5 text-sm text-[var(--accent)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{entry.definition}</p>
              {entry.exampleSentence && (
                <p className="mt-1 text-sm italic text-[var(--muted)]">
                  “{entry.exampleSentence}”
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                {entry.documentId ? (
                  <>
                    <Link
                      href={`/documents/${entry.documentId}`}
                      className="text-[var(--moss)] underline"
                    >
                      Linked document
                    </Link>
                    <button
                      type="button"
                      onClick={() => makeStandalone(entry._id)}
                      className="rounded-md bg-[var(--wash)] px-2 py-1"
                    >
                      Make standalone
                    </button>
                  </>
                ) : (
                  <>
                    <span>Standalone</span>
                    <select
                      className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) moveToDoc(entry._id, e.target.value);
                      }}
                      aria-label="Move to document"
                    >
                      <option value="">Move to document…</option>
                      {docs.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <span>· {new Date(entry.savedAt).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VocabularyPage() {
  return (
    <RequireAuth>
      <VocabularyContent />
    </RequireAuth>
  );
}
