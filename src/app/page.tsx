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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--moss)] border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <section className="relative min-h-[calc(100vh-1px)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(29,78,216,0.12), transparent 40%), radial-gradient(circle at 85% 15%, rgba(242,103,34,0.1), transparent 35%), linear-gradient(180deg, #f8fafc, #ffffff 50%, #eff6ff)",
        }}
      />
      <div className="relative mx-auto grid min-h-[calc(100vh-1px)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <div className="animate-fade-up">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-aksharax.png"
              alt="AksharaX"
              width={280}
              height={156}
              className="block h-auto w-full max-w-[200px] object-contain object-left sm:max-w-[240px]"
            />
          </div>
          <h1 className="animate-fade-up-delay mt-6 max-w-lg text-2xl font-medium leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
            Read smarter. Learn every word. Build a lasting vocabulary.
          </h1>
          <p className="animate-fade-up-delay mt-4 max-w-md text-[var(--muted)]">
            Upload documents or audio, edit text, tap words for meaning, and study
            with flashcards — all in one calm workspace.
          </p>
          <div className="animate-fade-up-delay mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="ui-btn ui-btn-primary px-7 py-3">
              Get started
            </Link>
            <Link href="/login" className="ui-btn ui-btn-outline px-7 py-3">
              Log in
            </Link>
          </div>
        </div>

        <div
          className="animate-fade-up-delay relative hidden min-h-[320px] overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-lg)] lg:block"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--sky-wash)] via-transparent to-[color-mix(in_srgb,var(--accent)_12%,transparent)]" />
          <div className="relative flex h-full flex-col justify-between p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moss)]">
              How it works
            </p>
            <ol className="mt-6 space-y-5">
              {[
                "Upload a scan, PDF, or lecture audio",
                "Read with tap-to-explain and translation",
                "Save words, quiz yourself, grow your streak",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--moss)] text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-[var(--ink)]">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex items-end gap-3">
              <div className="h-20 w-14 rounded-lg bg-[var(--moss)] shadow-md" />
              <div className="h-28 w-16 rounded-lg bg-[var(--ink)] shadow-md" />
              <div className="h-16 w-12 rounded-lg bg-[var(--accent)] shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
