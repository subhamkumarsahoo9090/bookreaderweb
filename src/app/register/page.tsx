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
    <div className="flex min-h-[calc(100vh-1px)] items-center justify-center px-4 py-12">
      <div className="animate-fade-up ui-panel w-full max-w-md p-7 sm:p-9">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-aksharax.png"
          alt="AksharaX"
          className="mb-6 h-9 w-auto max-w-[9rem] object-contain object-left"
        />
        <h1 className="page-title !text-2xl">Create account</h1>
        <p className="page-subtitle">
          Start your library of texts, notes, and vocabulary.
        </p>
        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="ui-label">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="ui-label">Password (min 6 characters)</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input"
              autoComplete="new-password"
            />
          </label>
          {error && <p className="text-sm font-medium text-[var(--accent)]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="ui-btn ui-btn-primary w-full py-3"
          >
            {submitting ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--moss)] underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
