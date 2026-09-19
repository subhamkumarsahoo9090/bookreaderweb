"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  text: string;
  activeIndex: number | null;
  onActiveIndexChange: (index: number | null) => void;
};

function splitSentences(text: string): string[] {
  const raw = String(text || "")
    .replace(/\r\n/g, "\n")
    // Soft wrap: single newlines become spaces so text fills the screen width
    .replace(/([^\n])\n(?!\n)/g, "$1 ")
    .trim();
  if (!raw) return [];

  // Hard breaks (blank lines) stay as paragraph boundaries
  const blocks = raw.split(/\n+/);
  const out: string[] = [];
  for (const block of blocks) {
    const trimmed = block.replace(/[ \t]+/g, " ").trim();
    if (!trimmed) continue;
    const parts = trimmed.match(/[^.!?।॥]+[.!?।॥]+|[^.!?।॥]+$/g);
    if (parts && parts.length) {
      parts.forEach((p) => {
        const s = p.trim();
        if (s) out.push(s);
      });
    } else {
      out.push(trimmed);
    }
  }
  return out.length ? out : [raw.replace(/\s+/g, " ").trim()];
}

export function ScreenReaderBar({
  text,
  activeIndex,
  onActiveIndexChange,
}: Props) {
  const sentences = useMemo(() => splitSentences(text), [text]);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [mode, setMode] = useState<"document" | "sentence">("document");

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel();
    };
  }, []);

  function speakFrom(start: number) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (!sentences.length) return;

    let i = Math.max(0, start);
    setPlaying(true);

    const speakNext = () => {
      if (i >= sentences.length || (mode === "sentence" && i > start)) {
        setPlaying(false);
        onActiveIndexChange(null);
        return;
      }
      onActiveIndexChange(i);
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.rate = rate;
      u.onend = () => {
        i += 1;
        if (mode === "sentence") {
          setPlaying(false);
          onActiveIndexChange(null);
          return;
        }
        speakNext();
      };
      u.onerror = () => {
        setPlaying(false);
        onActiveIndexChange(null);
      };
      window.speechSynthesis.speak(u);
    };

    speakNext();
  }

  function play() {
    const start = activeIndex ?? 0;
    speakFrom(start);
  }

  function pause() {
    window.speechSynthesis.pause();
    setPlaying(false);
  }

  function resume() {
    window.speechSynthesis.resume();
    setPlaying(true);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
    onActiveIndexChange(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      if (e.key === " ") {
        e.preventDefault();
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          pause();
        } else if (window.speechSynthesis.paused) {
          resume();
        } else {
          play();
        }
      }
      if (e.key === "Escape") stop();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, mode, activeIndex, sentences]);

  return (
    <div
      className="sticky bottom-0 z-30 border-t border-[var(--line)] bg-[var(--paper)]/95 p-3 backdrop-blur-md"
      role="region"
      aria-label="Screen reader controls"
    >
      <div className="mx-auto flex w-full max-w-none flex-wrap items-center gap-2 px-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--moss)]">
          Read aloud
        </span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "document" | "sentence")}
          className="rounded-md border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm"
          aria-label="Read mode"
        >
          <option value="document">Full document</option>
          <option value="sentence">Current sentence</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          Rate
          <input
            type="range"
            min={0.6}
            max={1.4}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            aria-label="Speech rate"
          />
        </label>
        <button
          type="button"
          onClick={play}
          className="rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm text-white"
        >
          Play
        </button>
        {playing ? (
          <button
            type="button"
            onClick={pause}
            className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={resume}
            className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
          >
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={stop}
          className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
        >
          Stop
        </button>
        <span className="text-xs text-[var(--muted)]">Space play/pause · Esc stop</span>
      </div>
    </div>
  );
}

export function SpokenDocument({
  text,
  activeIndex,
  onSelectWord,
}: {
  text: string;
  activeIndex: number | null;
  onSelectWord?: (word: string, context: string) => void;
}) {
  const sentences = useMemo(() => splitSentences(text), [text]);

  return (
    <article
      className="reader-prose w-full max-w-none text-lg leading-[1.85] text-[var(--ink)] sm:text-xl lg:text-[1.35rem]"
      aria-live="polite"
    >
      {sentences.map((sentence, i) => (
        <p
          key={i}
          className={`reader-para ${
            activeIndex === i ? "speak-active" : ""
          }`}
        >
          {sentence.split(/(\s+)/).map((part, j) =>
            /^\s+$/.test(part) ? (
              <span key={j}> </span>
            ) : /[\p{L}\p{M}]/u.test(part) ? (
              <button
                key={j}
                type="button"
                className="reader-word"
                onClick={() =>
                  onSelectWord?.(
                    part.replace(/[^\p{L}\p{M}'-]/gu, ""),
                    sentence
                  )
                }
              >
                {part}
              </button>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      ))}
    </article>
  );
}
