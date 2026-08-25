"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "/folders", label: "Folders" },
  { href: "/vocabulary", label: "Vocabulary" },
];

export function AppNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/folders" className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]">
          BookReader
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="ml-1 rounded-md px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-[var(--wash)] hover:text-[var(--ink)]"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
