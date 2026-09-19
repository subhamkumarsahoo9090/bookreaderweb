"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { THEMES, useTheme } from "@/lib/theme-context";

const primaryLinks = [
  { href: "/folders", label: "Folders" },
  { href: "/shared", label: "Books" },
  { href: "/search", label: "Search" },
  { href: "/study", label: "Study" },
  { href: "/notes", label: "Notes" },
];

const moreLinks = [
  { href: "/vocabulary", label: "Vocab" },
  { href: "/classroom", label: "Classroom" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;

  const adminLinks =
    user.role === "admin" ? [{ href: "/admin", label: "Admin" }] : [];
  const allMore = [...moreLinks, ...adminLinks];
  const moreActive = allMore.some((l) => pathname.startsWith(l.href));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-none items-center gap-3 px-3 sm:h-16 sm:px-4 lg:px-5">
        <Link href="/folders" className="shrink-0" aria-label="AksharaX home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-aksharax.png"
            alt="AksharaX"
            width={199}
            height={113}
            className="block h-[3.12rem] w-auto max-w-[13.26rem] object-contain object-left"
          />
        </Link>

        <nav
          className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1"
          aria-label="Main"
        >
          {primaryLinks.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`hidden rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition md:inline-flex ${
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                moreActive || moreOpen
                  ? "bg-[var(--wash)] text-[var(--ink)]"
                  : "text-[var(--muted)] hover:bg-[var(--wash)] hover:text-[var(--ink)]"
              }`}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              More
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] py-1 shadow-[var(--shadow-lg)]"
              >
                {[...primaryLinks, ...allMore].map((l) => {
                  const active = pathname.startsWith(l.href);
                  const isPrimary = primaryLinks.some((p) => p.href === l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={`block px-3 py-2 text-sm transition hover:bg-[var(--wash)] ${
                        isPrimary ? "md:hidden" : ""
                      } ${active ? "font-semibold text-[var(--moss)]" : "text-[var(--ink)]"}`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {(user.streak?.current || 0) > 0 && (
            <span className="ui-chip ml-1 hidden sm:inline-flex">
              {user.streak?.current}d streak
            </span>
          )}

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
            className="ml-1 hidden max-w-[8.5rem] rounded-lg border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-[12px] text-[var(--ink)] sm:block"
            aria-label="Color theme"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={logout}
            className="ui-btn ui-btn-ghost ml-0.5 !px-2.5 !py-1.5 text-[13px]"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
