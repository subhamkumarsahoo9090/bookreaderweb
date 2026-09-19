"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { SpokenDocument } from "@/components/ScreenReaderBar";
import { sharedLibraryApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { FontFamilyId, SharedBook } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/types";

function fontClass(id: FontFamilyId) {
  return `font-reader-${id}`;
}

function SharedReaderContent() {
  const { token, user } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [book, setBook] = useState<SharedBook | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [font, setFont] = useState<FontFamilyId>(
    user?.settings?.readingFontFamily || "fraunces"
  );

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await sharedLibraryApi.get(token, id);
      setBook(res.book);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="page-shell text-center">
        <p className="text-[var(--accent)]">{error || "Not found"}</p>
        <Link href="/shared" className="mt-4 inline-block text-[var(--moss)]">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell-full pb-16">
      <Link href="/shared" className="text-sm text-[var(--muted)]">
        ← AksharaX Books
      </Link>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
        {book.title}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {book.wordCount} words · read-only shared book
      </p>
      <label className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        Font
        <select
          value={font}
          onChange={(e) => setFont(e.target.value as FontFamilyId)}
          className="rounded-lg border border-[var(--line)] px-2 py-1"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div
        className={`mt-8 w-full max-w-none ${fontClass(font)}`}
        style={{
          fontSize: Math.max(user?.settings?.fontSize || 20, 20),
          lineHeight: user?.settings?.lineSpacing || 1.85,
        }}
      >
        <SpokenDocument text={book.extractedText} activeIndex={null} />
      </div>
    </div>
  );
}

export default function SharedBookPage() {
  return (
    <RequireAuth>
      <SharedReaderContent />
    </RequireAuth>
  );
}
