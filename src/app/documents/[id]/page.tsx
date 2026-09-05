"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { WordPopup } from "@/components/WordPopup";
import { HandwritingPad } from "@/components/HandwritingPad";
import { FloatingEditorPanel } from "@/components/FloatingEditorPanel";
import {
  ScreenReaderBar,
  SpokenDocument,
} from "@/components/ScreenReaderBar";
import {
  documentsApi,
  notesApi,
  progressApi,
  annotationsApi,
  libraryApi,
  generateQuiz,
  translateText,
  authApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Annotation, Document, FontFamilyId, QuizQuestion } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/types";

type Selection = { text: string; context?: string };
type Mode = "read" | "edit";
type SaveState = "saved" | "dirty" | "saving" | "error";

function fontClass(id: FontFamilyId) {
  return `font-reader-${id}`;
}

function DocumentReaderContent() {
  const { token, user, setUser } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("read");
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [showHandwrite, setShowHandwrite] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [activeSentence, setActiveSentence] = useState<number | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [percent, setPercent] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [translation, setTranslation] = useState("");
  const [shareMsg, setShareMsg] = useState("");

  const [readingFont, setReadingFont] = useState<FontFamilyId>(
    user?.settings?.readingFontFamily || "fraunces"
  );
  const [editorFont, setEditorFont] = useState<FontFamilyId>(
    user?.settings?.editorFontFamily || "outfit"
  );
  const [fontSize, setFontSize] = useState(user?.settings?.fontSize || 18);
  const [lineSpacing, setLineSpacing] = useState(
    user?.settings?.lineSpacing || 1.6
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [res, prog, ann] = await Promise.all([
        documentsApi.get(token, id),
        progressApi.get(token, id),
        annotationsApi.list(token, id),
      ]);
      setDocument(res.document);
      setDraft(res.document.extractedText || "");
      setSaveState("saved");
      setAnnotations(ann.annotations);
      if (prog.progress) {
        setPercent(prog.progress.percent || 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.settings?.dyslexiaFont) {
      globalThis.document.documentElement.classList.add("dyslexia");
      setReadingFont("opendyslexic");
    } else {
      globalThis.document.documentElement.classList.remove("dyslexia");
      if (user?.settings?.readingFontFamily) {
        setReadingFont(user.settings.readingFontFamily);
      }
    }
    if (user?.settings?.lineSpacing) setLineSpacing(user.settings.lineSpacing);
    if (user?.settings?.fontSize) setFontSize(user.settings.fontSize);
    if (user?.settings?.editorFontFamily) {
      setEditorFont(user.settings.editorFontFamily);
    }
  }, [user?.settings]);

  async function persistFontPrefs(partial: {
    readingFontFamily?: FontFamilyId;
    editorFontFamily?: FontFamilyId;
    fontSize?: number;
    lineSpacing?: number;
  }) {
    if (!token) return;
    try {
      const res = await authApi.updateSettings(token, partial);
      setUser(res.user);
    } catch {
      /* local still applied */
    }
  }

  function reportProgress(pct: number, offset = 0) {
    if (!token || !document) return;
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(async () => {
      try {
        const res = await progressApi.save(token, {
          documentId: document._id,
          charOffset: offset,
          percent: pct,
        });
        setPercent(res.progress.percent);
        if (res.streak && user) setUser({ ...user, streak: res.streak });
      } catch {
        /* ignore */
      }
    }, 800);
  }

  const persist = useCallback(
    async (text: string) => {
      if (!token || !document) return;
      setSaveState("saving");
      try {
        const res = await documentsApi.update(token, document._id, {
          extractedText: text,
        });
        setDocument(res.document);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [token, document]
  );

  function onDraftChange(value: string) {
    setDraft(value);
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(value), 900);
  }

  async function manualSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persist(draft);
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      onDraftChange(`${draft}${draft.endsWith(" ") || !draft ? "" : " "}${text}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = draft.slice(0, start) + text + draft.slice(end);
    onDraftChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function saveNote() {
    if (!token || !document || !noteTitle.trim() || !noteContent.trim()) return;
    try {
      await notesApi.create(token, {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        documentId: document._id,
        folderId: document.folderId,
      });
      setNoteMsg("Note saved");
      setNoteTitle("");
      setNoteContent("");
      setTimeout(() => {
        setNoteOpen(false);
        setNoteMsg("");
      }, 800);
    } catch (e) {
      setNoteMsg(e instanceof Error ? e.message : "Could not save note");
    }
  }

  async function runQuiz() {
    if (!draft.trim()) return;
    setQuiz(null);
    const res = await generateQuiz(draft.slice(0, 10000));
    setQuiz(res.questions);
    setQuizAnswers({});
  }

  async function translateSelection() {
    if (!selected?.text) return;
    const lang = user?.settings?.preferredLanguage || "hi";
    const res = await translateText(selected.text, lang);
    setTranslation(res.translation);
  }

  async function highlightSelection(color: Annotation["color"] = "yellow") {
    if (!token || !document || !selected?.text) return;
    const res = await annotationsApi.create(token, {
      documentId: document._id,
      selectedText: selected.text,
      color,
      comment: "",
    });
    setAnnotations((prev) => [res.annotation, ...prev]);
  }

  async function toggleShare() {
    if (!token || !document) return;
    const makePublic = !document.isPublic;
    const res = await libraryApi.shareDocument(token, document._id, makePublic);
    setDocument(res.document);
    setShareMsg(
      makePublic
        ? `Shared: ${window.location.origin}${res.shareUrl}`
        : "Unshared"
    );
  }

  const statusLabel = useMemo(() => {
    if (saveState === "saving") return "Saving…";
    if (saveState === "dirty") return "Unsaved changes";
    if (saveState === "error") return "Save failed";
    return "Saved";
  }, [saveState]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="page-shell text-center">
        <p className="text-[var(--accent)]">{error || "Document not found"}</p>
        <Link href="/folders" className="mt-4 inline-block text-[var(--moss)]">
          Back to folders
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div className="page-shell">
        <Link
          href={`/folders/${document.folderId}`}
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← Back to folder
        </Link>
        <header className="mt-4 border-b border-[var(--line)] pb-4">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {document.wordCount} words · {document.fileType.toUpperCase()} ·{" "}
            {Math.round(percent)}% read
            {document.storage === "drive" ? " · Drive" : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("read")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                mode === "read"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--wash)]"
              }`}
            >
              Read
            </button>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                mode === "edit"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--wash)]"
              }`}
            >
              Edit
            </button>
            <label className="flex items-center gap-1 rounded-lg bg-[var(--wash)] px-2 py-1 text-sm">
              Font
              <select
                value={readingFont}
                onChange={(e) => {
                  const f = e.target.value as FontFamilyId;
                  setReadingFont(f);
                  persistFontPrefs({ readingFontFamily: f });
                }}
                className="rounded border-0 bg-transparent text-sm outline-none"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setShowReader((v) => !v)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                showReader ? "bg-[var(--moss)] text-white" : "bg-[var(--wash)]"
              }`}
              aria-pressed={showReader}
            >
              Screen reader
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
            >
              Add note
            </button>
            <button
              type="button"
              onClick={runQuiz}
              className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
            >
              AI quiz
            </button>
            <button
              type="button"
              onClick={toggleShare}
              className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
            >
              {document.isPublic ? "Unshare" : "Share public"}
            </button>
            <button
              type="button"
              onClick={() => reportProgress(100, draft.length)}
              className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
            >
              Mark complete
            </button>
          </div>
          {shareMsg && (
            <p className="mt-2 break-all text-xs text-[var(--moss)]">{shareMsg}</p>
          )}
          {annotations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {annotations.slice(0, 8).map((a) => (
                <span
                  key={a._id}
                  className="rounded-md bg-[var(--highlight)] px-2 py-1 text-xs"
                  title={a.comment || a.color}
                >
                  {a.selectedText.slice(0, 40)}
                </span>
              ))}
            </div>
          )}
        </header>

        <div
          className="mt-8"
          style={{ lineHeight: lineSpacing }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const max = el.scrollHeight - el.clientHeight;
            if (max > 0) {
              const pct = Math.min(99, Math.round((el.scrollTop / max) * 100));
              reportProgress(pct, Math.round((pct / 100) * draft.length));
            }
          }}
          onMouseUp={() => {
            if (mode !== "read") return;
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) return;
            const value = sel.toString().replace(/\s+/g, " ").trim();
            if (value.length < 2 || value.length > 500) return;
            setSelected({
              text: value,
              context: value.includes(" ") ? value : undefined,
            });
            setTranslation("");
            sel.removeAllRanges();
          }}
        >
          <p className="mb-4 text-sm text-[var(--muted)]">
            {mode === "edit"
              ? "Drag the floating editor anywhere. Reading view stays visible behind it."
              : "Tap a word or highlight a sentence for meaning and examples."}
          </p>
          <div
            className={fontClass(readingFont)}
            style={{ fontSize, lineHeight: lineSpacing }}
          >
            <SpokenDocument
              text={draft}
              activeIndex={showReader && mode === "read" ? activeSentence : null}
              onSelectWord={(word, context) =>
                mode === "read" ? setSelected({ text: word, context }) : undefined
              }
            />
          </div>
        </div>
      </div>

      {mode === "edit" && (
        <FloatingEditorPanel
          value={draft}
          onChange={onDraftChange}
          onSave={manualSave}
          onClose={() => setMode("read")}
          onHandwrite={() => setShowHandwrite(true)}
          statusLabel={statusLabel}
          fontFamily={editorFont}
          onFontFamilyChange={(f) => {
            setEditorFont(f);
            persistFontPrefs({ editorFontFamily: f });
          }}
          fontSize={fontSize}
          onFontSizeChange={(n) => {
            setFontSize(n);
            persistFontPrefs({ fontSize: n });
          }}
          lineSpacing={lineSpacing}
          onLineSpacingChange={(n) => {
            setLineSpacing(n);
            persistFontPrefs({ lineSpacing: n });
          }}
          textareaRef={textareaRef}
        />
      )}

      {showReader && mode === "read" && (
        <ScreenReaderBar
          text={draft}
          activeIndex={activeSentence}
          onActiveIndexChange={setActiveSentence}
        />
      )}

      {selected && (
        <WordPopup
          text={selected.text}
          context={selected.context}
          documentId={document._id}
          folderId={document.folderId}
          onClose={() => {
            setSelected(null);
            setTranslation("");
          }}
        />
      )}

      {selected && (
        <div className="fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 flex-wrap justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-2 shadow-lg">
          <button
            type="button"
            onClick={translateSelection}
            className="rounded-lg bg-[var(--moss)] px-3 py-1.5 text-sm text-white"
          >
            Translate
          </button>
          <button
            type="button"
            onClick={() => highlightSelection("yellow")}
            className="rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
          >
            Highlight
          </button>
          {translation && (
            <p className="w-full max-w-sm px-2 text-sm text-[var(--ink)]">
              {translation}
            </p>
          )}
        </div>
      )}

      {quiz && (
        <div className="page-shell mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Chapter quiz
          </h2>
          <ol className="mt-4 space-y-4">
            {quiz.map((q, qi) => (
              <li key={qi}>
                <p className="font-medium">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={quizAnswers[qi] === oi}
                        onChange={() =>
                          setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))
                        }
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                {quizAnswers[qi] !== undefined && (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {quizAnswers[qi] === q.answerIndex
                      ? "Correct"
                      : `Answer: ${q.options[q.answerIndex]}`}
                    {q.explanation ? ` — ${q.explanation}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setQuiz(null)}
            className="mt-4 rounded-lg bg-[var(--wash)] px-3 py-1.5 text-sm"
          >
            Close quiz
          </button>
        </div>
      )}

      {showHandwrite && (
        <HandwritingPad
          onInsert={(t) => insertAtCursor(t + " ")}
          onClose={() => setShowHandwrite(false)}
        />
      )}

      {noteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center"
          onClick={() => setNoteOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[var(--paper)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Add note"
          >
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              Add note
            </h2>
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title"
              className="mt-3 w-full rounded-xl border border-[var(--line)] px-3 py-2"
            />
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Your note…"
              rows={5}
              className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2"
            />
            {noteMsg && (
              <p className="mt-2 text-sm text-[var(--muted)]">{noteMsg}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={saveNote}
                className="rounded-lg bg-[var(--moss)] px-4 py-2 text-sm text-white"
              >
                Save note
              </button>
              <button
                type="button"
                onClick={() => setNoteOpen(false)}
                className="rounded-lg bg-[var(--wash)] px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentPage() {
  return (
    <RequireAuth>
      <DocumentReaderContent />
    </RequireAuth>
  );
}
