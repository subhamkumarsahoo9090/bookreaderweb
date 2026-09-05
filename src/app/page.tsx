"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import PixelSwap from "@/components/PixelSwap";

export default function HomePage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.replace("/folders");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--moss)] border-t-transparent" />
        <p className="text-sm text-[var(--muted)]">Checking session…</p>
        <Link href="/login" className="text-sm font-medium text-[var(--moss)]">
          Go to login
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--moss)] border-t-transparent" />
        <p className="text-sm text-[var(--muted)]">Opening your library…</p>
        <Link href="/folders" className="text-sm font-medium text-[var(--moss)]">
          Open folders
        </Link>
      </div>
    );
  }

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

        <div className="animate-fade-up-delay relative w-full overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper)] shadow-[var(--shadow-lg)]">
          <PixelSwap
            className="w-full"
            aspectRatio="4 / 3"
            firstContent={
              <div className="flex h-full w-full flex-col items-center justify-center bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_45%,#fff7ed_100%)] p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--moss)]">
                  Hover me
                </p>
                <p className="mt-4 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] sm:text-3xl">
                  Discover AksharaX
                </p>
                <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
                  Move over this card to reveal how reading becomes learning.
                </p>
              </div>
            }
            secondContent={
              <div className="flex h-full w-full flex-col justify-between bg-[linear-gradient(160deg,#1d4ed8_0%,#0b1220_100%)] p-8 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                  How it works
                </p>
                <ol className="mt-6 space-y-4">
                  {[
                    "Upload a scan, PDF, or lecture audio",
                    "Read with tap-to-explain and translation",
                    "Save words, quiz yourself, grow your streak",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm sm:text-base">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
                        {i + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 text-sm text-blue-100">You found the path.</p>
              </div>
            }
            pixelSize={48}
            gap={0}
            pixelRadius={0}
            pixelSpin={0}
            pixelScale={0.35}
            duration={1400}
            pixelDuration={450}
            pattern="random"
            randomness={0}
            fade
            trigger="hover"
          />
        </div>
      </div>
    </section>
  );
}
