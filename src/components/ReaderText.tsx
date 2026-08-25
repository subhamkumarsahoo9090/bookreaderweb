"use client";

import { useMemo, useState } from "react";
import { WordPopup } from "./WordPopup";

type Props = {
  text: string;
  documentId: string;
};

type Token = { type: "word" | "other"; value: string; index: number };

type Selection = {
  text: string;
  context?: string;
};

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /([A-Za-z]+(?:[''][A-Za-z]+)?)|([^A-Za-z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      tokens.push({ type: "word", value: m[1], index: m.index });
    } else if (m[2]) {
      tokens.push({ type: "other", value: m[2], index: m.index });
    }
  }
  return tokens;
}

function sentenceAround(fullText: string, start: number, end: number): string {
  const breakChars = ".!?\n";
  let left = start;
  while (left > 0 && !breakChars.includes(fullText[left - 1])) left -= 1;
  let right = end;
  while (right < fullText.length && !breakChars.includes(fullText[right])) {
    right += 1;
  }
  if (right < fullText.length && breakChars.includes(fullText[right])) {
    right += 1;
  }
  return fullText.slice(left, right).trim().replace(/\s+/g, " ");
}

export function ReaderText({ text, documentId }: Props) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const [selected, setSelected] = useState<Selection | null>(null);

  function onWordClick(word: string, index: number) {
    const context = sentenceAround(text, index, index + word.length);
    setSelected({ text: word, context });
  }

  function onMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const value = sel.toString().replace(/\s+/g, " ").trim();
    if (value.length < 2 || value.length > 500) return;

    // Only react to selections inside this reader article
    const anchor = sel.anchorNode;
    const article = document.getElementById("reader-article");
    if (!article || !anchor || !article.contains(anchor)) return;

    setSelected({
      text: value,
      context: value.includes(" ") ? value : undefined,
    });
    sel.removeAllRanges();
  }

  return (
    <>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Tap a word, or highlight a sentence, for a simple explanation and 3
        daily-life examples.
      </p>
      <article
        id="reader-article"
        onMouseUp={onMouseUp}
        className="reader-prose whitespace-pre-wrap font-[family-name:var(--font-display)] text-lg leading-[1.85] text-[var(--ink)] sm:text-xl"
      >
        {tokens.map((t, i) =>
          t.type === "word" ? (
            <button
              key={i}
              type="button"
              className="reader-word rounded-sm px-0.5 transition hover:bg-[var(--highlight)]"
              onClick={() => onWordClick(t.value, t.index)}
            >
              {t.value}
            </button>
          ) : (
            <span key={i}>{t.value}</span>
          )
        )}
      </article>
      {selected && (
        <WordPopup
          text={selected.text}
          context={selected.context}
          documentId={documentId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
