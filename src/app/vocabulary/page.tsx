"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { vocabularyApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { VocabularyEntry } from "@/lib/types";

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function VocabularyContent() {
  const { token } = useAuth();
  const [words, setWords] = useState<VocabularyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await vocabularyApi.list(token);
      setWords(res.vocabulary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vocabulary");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRemove(id: string) {
    if (!token) return;
    try {
      await vocabularyApi.remove(token, id);
      setWords((prev) => prev.filter((w) => w._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove word");
    }
  }

  return (
    <div className="page-shell-wide">
      <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
        Vocabulary
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Words you saved while reading.
      </p>

      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      ) : words.length === 0 ? (
        <p className="mt-12 text-center text-[var(--muted)]">
          No saved words yet. Tap a word in the reader to save it.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {words.map((entry, i) => (
            <li
              key={entry._id}
              className="animate-fade-up rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4"
              style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                    {entry.word}
                  </h2>
                  {entry.phonetic && (
                    <p className="text-sm text-[var(--muted)]">{entry.phonetic}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => speak(entry.word)}
                    className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm text-[var(--ink)] hover:bg-[var(--line)]"
                  >
                    Speak
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry._id)}
                    className="rounded-lg px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--wash)]"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
                {entry.definition}
              </p>
              {entry.exampleSentence && (
                <p className="mt-1 text-sm italic text-[var(--muted)]">
                  “{entry.exampleSentence}”
                </p>
              )}
              <p className="mt-2 text-xs text-[var(--muted)]">
                Saved {new Date(entry.savedAt).toLocaleString()}
              </p>
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
