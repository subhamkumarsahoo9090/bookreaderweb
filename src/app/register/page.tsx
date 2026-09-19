"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace("/folders");
    }
  }, [loading, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(email.trim(), password);
      window.location.replace("/folders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const res = await authApi.googleStart("login");
      window.location.href = res.url;
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 503
          ? "Google sign-up is not configured yet. Use email/password."
          : err instanceof Error
            ? err.message
            : "Google sign-up failed";
      setError(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <AuthScreen>
      <h1 className="page-title !text-2xl text-center">Create account</h1>
      <p className="page-subtitle text-center">
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
        {error && (
          <p className="text-sm font-medium text-[var(--accent)]">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="ui-btn ui-btn-primary w-full py-3"
        >
          {submitting ? "Creating…" : "Register"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-xs text-[var(--muted)]">or</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <button
        type="button"
        onClick={onGoogle}
        disabled={googleLoading}
        className="ui-btn ui-btn-ghost w-full py-3"
      >
        {googleLoading ? "Opening Google…" : "Continue with Google"}
      </button>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--moss)] underline-offset-2 hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthScreen>
  );
}
