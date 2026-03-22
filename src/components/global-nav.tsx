"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/6 bg-[#111214]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5865f2] text-sm font-semibold text-white shadow-[0_12px_24px_rgba(88,101,242,0.35)]">
            PM
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              Profit Maxing
            </p>
            <p className="text-xs text-[#949ba4]">
              Trading journal for private and guest workflows
            </p>
          </div>
        </Link>

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
      </div>
    </header>
  );
}
