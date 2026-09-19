"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.replace("/folders");
    }
  }, [loading, user]);

  if (loading || user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--moss)] border-t-transparent" />
        <p className="text-sm text-[var(--muted)]">
          {user ? "Opening your library…" : "Checking session…"}
        </p>
        <Link
          href={user ? "/folders" : "/login"}
          className="text-sm font-medium text-[var(--moss)]"
        >
          {user ? "Open folders" : "Go to login"}
        </Link>
      </div>
    );
  }

  return (
    <div className="home-landing">
      <section className="home-hero" aria-label="AksharaX">
        <div className="home-hero__copy">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-aksharax.png"
            alt="AksharaX"
            width={360}
            height={202}
            className="home-hero__brand animate-fade-up"
          />
          <h1 className="home-hero__headline animate-fade-up-delay">
            Read smarter. Learn every word.
          </h1>
          <p className="home-hero__lede animate-fade-up-delay">
            Upload texts, tap for meaning, and grow a vocabulary that sticks.
          </p>
          <div className="home-hero__actions animate-fade-up-delay">
            <Link href="/register" className="home-cta home-cta--primary">
              Get started
            </Link>
            <Link href="/login" className="home-cta home-cta--secondary">
              Log in
            </Link>
          </div>
        </div>

        <div className="home-hero__visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="home-hero__img"
          />
          <div className="home-hero__visual-veil" aria-hidden="true" />
          <Link href="/login" className="home-hero__visual-login">
            Log in
          </Link>

          <div className="home-hero__on-image">
            <h2 className="home-hero__on-title">From page to progress</h2>
            <p className="home-hero__on-intro">
              One calm workspace for reading, meaning, and daily practice.
            </p>
            <ol className="home-hero__on-steps">
              <li>
                <span className="home-hero__on-num">01</span>
                <strong>Bring your material</strong>
                <span>PDF, scan, or lecture audio — into your library.</span>
              </li>
              <li>
                <span className="home-hero__on-num">02</span>
                <strong>Read with support</strong>
                <span>Tap a word for meaning, examples, and notes.</span>
              </li>
              <li>
                <span className="home-hero__on-num">03</span>
                <strong>Keep what you learn</strong>
                <span>Flashcards, quizzes, and a vocabulary that grows.</span>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
