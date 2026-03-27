"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/login/actions";

const navItems = [
  { href: "/", label: "Home", match: (pathname: string) => pathname === "/" },
  {
    href: "/demo",
    label: "Guest Demo",
    match: (pathname: string) => pathname.startsWith("/demo"),
  },
  {
    href: "/dashboard",
    label: "Personal",
    match: (pathname: string) =>
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/journal") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/playbook") ||
      pathname.startsWith("/trades") ||
      pathname.startsWith("/login"),
  },
];

export function GlobalNav({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountOpen]);

  return (
    <header className="border-b border-white/6 bg-[#111214]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Profit Maxing"
              width={60}
              height={60}
              className="h-[60px] w-[60px] object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-white">
                Profit Maxing
              </p>
              <p className="text-xs text-[#949ba4]">
                Trading journal for private and guest workflows
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-3">
          <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-[#1e1f22] p-1">
            {navItems.map((item) => {
              const isActive = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#5865f2] text-white shadow-[0_10px_20px_rgba(88,101,242,0.25)]"
                      : "text-[#b5bac1] hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {userEmail ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((current) => !current)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#1e1f22] text-[#dbdee1] transition hover:bg-white/6 hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              {accountOpen ? (
                <div className="absolute right-0 top-full z-20 mt-3 w-72 rounded-[24px] border border-white/8 bg-[#1e1f22] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#949ba4]">
                    Signed In
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-white">
                    {userEmail}
                  </p>

                  <form action={signOut} className="mt-4">
                    <button
                      type="submit"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
