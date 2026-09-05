"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function CallbackInner() {
  const { loginWithToken } = useAuth();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing login token from Google");
      return;
    }
    loginWithToken(token)
      .then(() => {
        window.location.replace("/folders");
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Google login failed")
      );
  }, [params, loginWithToken]);

  if (error) {
    return (
      <div className="page-shell text-center">
        <p className="text-[var(--accent)]">{error}</p>
        <a href="/login" className="mt-4 inline-block text-[var(--moss)]">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
