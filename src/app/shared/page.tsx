"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { sharedLibraryApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { SharedBookMeta } from "@/lib/types";

function SharedLibraryContent() {
  const { token } = useAuth();
  const [books, setBooks] = useState<SharedBookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await sharedLibraryApi.list(token);
      setBooks(res.books);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

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

  return (
    <div className="page-shell">
      <h1 className="page-title">AksharaX Books</h1>
      <p className="page-subtitle">
        Shared educational books uploaded by admins — open any to read.
      </p>
      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      {books.length === 0 ? (
        <p className="mt-8 text-[var(--muted)]">No published books yet.</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {books.map((b) => (
            <li key={b._id}>
              <Link
                href={`/shared/${b._id}`}
                className="ui-panel block p-5 transition hover:border-[var(--moss)]"
              >
                <h2 className="font-semibold text-[var(--ink)]">{b.title}</h2>
                {b.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                    {b.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {b.category || "General"} · {b.wordCount} words
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SharedLibraryPage() {
  return (
    <RequireAuth>
      <SharedLibraryContent />
    </RequireAuth>
  );
}
