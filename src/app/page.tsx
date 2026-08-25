"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/folders");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232f6b4f' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-1px)] max-w-5xl flex-col justify-center px-4 py-16 sm:px-6">
        <p className="animate-fade-up font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--ink)] sm:text-7xl">
          BookReader
        </p>
        <h1 className="animate-fade-up-delay mt-4 max-w-xl text-xl text-[var(--muted)] sm:text-2xl">
          Turn scanned pages into clickable text — speak, define, and save words as you read.
        </h1>
        <div className="animate-fade-up-delay mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-[var(--moss)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-6 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--wash)]"
          >
            Log in
          </Link>
        </div>
        <div
          className="animate-fade-up-delay mt-16 h-40 w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--sky-wash)] via-[var(--paper)] to-[var(--wash)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          aria-hidden
        >
          <div className="flex h-full items-end gap-3 p-6">
            <div className="h-24 w-16 rounded-sm bg-[var(--moss)]/80 shadow-md" />
            <div className="h-28 w-20 rounded-sm bg-[var(--ink)]/70 shadow-md" />
            <div className="h-20 w-14 rounded-sm bg-[var(--accent)]/70 shadow-md" />
            <div className="mb-2 ml-auto hidden text-sm text-[var(--muted)] sm:block">
              OCR → text → tap to learn
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
