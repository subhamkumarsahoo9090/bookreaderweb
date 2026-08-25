"use client";

import { useEffect, useState } from "react";
import { vocabularyApi } from "@/lib/api";
import { explainSelection } from "@/lib/explain";
import { useAuth } from "@/lib/auth-context";

type Props = {
  text: string;
  context?: string;
  documentId?: string;
  onClose: () => void;
};

function speak(value: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(value);
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export function WordPopup({ text, context, documentId, onClose }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [sentences, setSentences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isPhrase = text.trim().includes(" ");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSaved(false);
    setExplanation("");
    setSentences([]);

    explainSelection(text, context)
      .then((res) => {
        if (cancelled) return;
        setExplanation(res.explanation);
        setSentences(res.sentences);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not explain");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [text, context]);

  async function handleSave() {
    if (!token || !explanation) return;
    setSaving(true);
    try {
      await vocabularyApi.save(token, {
        word: text.trim().toLowerCase().slice(0, 120),
        definition: explanation,
        exampleSentence: sentences[0],
        documentId,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save word");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="word-popup max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--paper)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Explain ${text}`}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--moss)]">
              {isPhrase ? "Selected sentence" : "Word"}
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {text}
            </h2>
            {context && context !== text && (
              <p className="mt-1 text-sm italic text-[var(--muted)]">
                In context: “{context}”
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--wash)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-[var(--muted)]">
              Explaining this and writing 3 daily-life sentences…
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--wash)]">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--moss)]" />
            </div>
          </div>
        )}

        {error && !loading && (
          <p className="text-sm text-[var(--accent)]">{error}</p>
        )}

        {!loading && explanation && (
          <div className="space-y-5">
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--moss)]">
                Easy meaning
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink)]">
                {explanation}
              </p>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--moss)]">
                3 daily-life sentences
              </h3>
              <ol className="mt-2 space-y-2">
                {sentences.map((sentence, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-xl bg-[var(--wash)]/70 px-3 py-2"
                  >
                    <span className="mt-0.5 text-xs font-medium text-[var(--muted)]">
                      {i + 1}.
                    </span>
                    <p className="flex-1 text-sm leading-relaxed text-[var(--ink)]">
                      {sentence}
                    </p>
                    <button
                      type="button"
                      onClick={() => speak(sentence)}
                      className="shrink-0 rounded-md px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--line)]"
                      aria-label={`Speak sentence ${i + 1}`}
                    >
                      Speak
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => speak(text)}
            className="rounded-lg bg-[var(--wash)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--line)]"
          >
            Speak
          </button>
          <button
            type="button"
            disabled={!explanation || saving || saved}
            onClick={handleSave}
            className="rounded-lg bg-[var(--moss)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saved ? "Saved" : saving ? "Saving…" : "Save to vocabulary"}
          </button>
        </div>
      </div>
    </div>
  );
}
