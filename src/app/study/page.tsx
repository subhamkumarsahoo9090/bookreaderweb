"use client";

import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { flashcardsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { VocabularyEntry } from "@/lib/types";

function StudyContent() {
  const { token, user, setUser } = useAuth();
  const [cards, setCards] = useState<VocabularyEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await flashcardsApi.due(token);
      setCards(res.cards);
      setIndex(0);
      setFlipped(false);
      setDone(res.cards.length === 0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(quality: number) {
    if (!token || !cards[index]) return;
    const res = await flashcardsApi.review(token, cards[index]._id, quality);
    if (res.streak && user) {
      setUser({ ...user, streak: res.streak });
    }
    const next = index + 1;
    if (next >= cards.length) {
      setDone(true);
    } else {
      setIndex(next);
      setFlipped(false);
    }
  }

  const card = cards[index];

  return (
    <div className="page-shell">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Flashcards
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Spaced repetition from your vocabulary · streak{" "}
        {user?.streak?.current || 0} day
        {(user?.streak?.current || 0) === 1 ? "" : "s"}
      </p>

      {loading ? (
        <div className="mt-16 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      ) : done ? (
        <div className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8 text-center">
          <p className="text-lg text-[var(--ink)]">All caught up for now.</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-xl bg-[var(--moss)] px-4 py-2 text-sm text-white"
          >
            Check again
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-3 text-sm text-[var(--muted)]">
            Card {index + 1} / {cards.length}
          </p>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="min-h-[220px] w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8 text-left shadow-sm transition hover:border-[var(--moss)]"
          >
            {!flipped ? (
              <>
                <p className="text-xs uppercase tracking-wide text-[var(--moss)]">
                  {card.type || "word"}
                </p>
                <p className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                  {card.text || card.word}
                </p>
                <p className="mt-6 text-sm text-[var(--muted)]">Tap to reveal</p>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-[var(--ink)]">
                  {card.definition}
                </p>
                {card.exampleSentence && (
                  <p className="mt-3 italic text-[var(--muted)]">
                    “{card.exampleSentence}”
                  </p>
                )}
              </>
            )}
          </button>
          {flipped && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => review(1)}
                className="rounded-xl bg-[var(--accent)]/15 px-4 py-2 text-sm text-[var(--accent)]"
              >
                Again
              </button>
              <button
                type="button"
                onClick={() => review(3)}
                className="rounded-xl bg-[var(--wash)] px-4 py-2 text-sm"
              >
                Hard
              </button>
              <button
                type="button"
                onClick={() => review(4)}
                className="rounded-xl bg-[var(--moss)]/15 px-4 py-2 text-sm text-[var(--moss)]"
              >
                Good
              </button>
              <button
                type="button"
                onClick={() => review(5)}
                className="rounded-xl bg-[var(--moss)] px-4 py-2 text-sm text-white"
              >
                Easy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <RequireAuth>
      <StudyContent />
    </RequireAuth>
  );
}
