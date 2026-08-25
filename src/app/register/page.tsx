"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/folders");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      router.replace("/folders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell flex min-h-[70vh] flex-col justify-center">
      <div className="animate-fade-up mx-auto w-full max-w-md">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Create account
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Start a library of OCR’d texts and saved words.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--muted)]">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none ring-[var(--moss)] focus:ring-2"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-[var(--muted)]">
              Password (min 6 characters)
            </span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none ring-[var(--moss)] focus:ring-2"
              autoComplete="new-password"
            />
          </label>
          {error && <p className="text-sm text-[var(--accent)]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[var(--moss)] py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--moss)] underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
