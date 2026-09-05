"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { authApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
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
      await login(email.trim(), password);
      window.location.replace("/folders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          ? "Google sign-in is not configured yet. Use email/password."
          : err instanceof Error
            ? err.message
            : "Google sign-in failed";
      setError(msg);
      setGoogleLoading(false);
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
        <h1 className="page-title !text-2xl">Welcome back</h1>
        <p className="page-subtitle">Log in to continue your reading library.</p>
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
            <span className="ui-label">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-sm font-medium text-[var(--accent)]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="ui-btn ui-btn-primary w-full py-3"
          >
            {submitting ? "Signing in…" : "Log in"}
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
          New here?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--moss)] underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
