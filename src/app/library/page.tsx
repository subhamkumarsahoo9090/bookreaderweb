"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { libraryApi } from "@/lib/api";
import type { DocumentMeta } from "@/lib/types";

export default function PublicLibraryPage() {
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    libraryApi
      .publicList()
      .then((res) => setDocs(res.documents))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load library")
      );
  }, []);

  return (
    <div className="page-shell-wide">
      <h1 className="font-[family-name:var(--font-display)] text-3xl">
        Public reading rooms
      </h1>
      <p className="mt-1 text-[var(--muted)]">
        Shared documents from the community. Open any to read without owning
        them.
      </p>
      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((d) => (
          <li
            key={d._id}
            className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4"
          >
            <Link
              href={`/library/${d.shareSlug}`}
              className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] hover:text-[var(--moss)]"
            >
              {d.title}
            </Link>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {d.wordCount} words · {d.fileType}
            </p>
          </li>
        ))}
      </ul>
      {!docs.length && !error && (
        <p className="mt-12 text-center text-[var(--muted)]">
          No public documents yet. Share one from the reader.
        </p>
      )}
    </div>
  );
}
