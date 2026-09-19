"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { libraryApi } from "@/lib/api";
import type { Document } from "@/lib/types";

export default function SharedDocumentPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [doc, setDoc] = useState<Document | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    libraryApi
      .publicDoc(slug)
      .then((res) => setDoc(res.document))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Not found")
      );
  }, [slug]);

  if (error) {
    return (
      <div className="page-shell text-center">
        <p className="text-[var(--accent)]">{error}</p>
        <Link href="/library" className="mt-4 inline-block text-[var(--moss)]">
          Back to library
        </Link>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-shell-full">
      <Link href="/library" className="text-sm text-[var(--muted)]">
        ← Public library
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
        {doc.title}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Shared reading · {doc.wordCount} words
      </p>
      <article
        className="reader-prose reader-para mt-8 w-full max-w-none whitespace-pre-wrap text-lg leading-[1.85] sm:text-xl"
        style={{ textAlign: "justify", textAlignLast: "start" }}
      >
        {doc.extractedText}
      </article>
    </div>
  );
}
