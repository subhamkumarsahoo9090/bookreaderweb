"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { ReaderText } from "@/components/ReaderText";
import { documentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Document } from "@/lib/types";

function DocumentReaderContent() {
  const { token } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await documentsApi.get(token, id);
      setDocument(res.document);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load document");
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
    <div className="page-shell">
      <Link
        href={`/folders/${document.folderId}`}
        className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← Back to folder
      </Link>
      <header className="animate-fade-up mt-4 border-b border-[var(--line)] pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {document.wordCount} words · tap a word or highlight a sentence for help
        </p>
      </header>
      <div className="animate-fade-up-delay mt-8">
        {document.extractedText?.trim() ? (
          <ReaderText text={document.extractedText} documentId={document._id} />
        ) : (
          <p className="text-[var(--muted)]">No text was extracted from this file.</p>
        )}
      </div>
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
