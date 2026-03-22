"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type WorkspaceVariant = "real" | "demo";

const tabSets: Record<
  WorkspaceVariant,
  Array<{
    href: string;
    label: string;
    match: (pathname: string) => boolean;
  }>
> = {
  real: [
    {
      href: "/dashboard",
      label: "Dashboard",
      match: (pathname) => pathname.startsWith("/dashboard"),
    },
    {
      href: "/analytics",
      label: "Analytics",
      match: (pathname) => pathname.startsWith("/analytics"),
    },
    {
      href: "/journal",
      label: "Journal",
      match: (pathname) => pathname.startsWith("/journal"),
    },
    {
      href: "/playbook",
      label: "Playbook",
      match: (pathname) => pathname.startsWith("/playbook"),
    },
  ],
  demo: [
    {
      href: "/demo",
      label: "Dashboard",
      match: (pathname) => pathname === "/demo",
    },
    {
      href: "/demo/analytics",
      label: "Analytics",
      match: (pathname) => pathname.startsWith("/demo/analytics"),
    },
    {
      href: "/demo/journal",
      label: "Journal",
      match: (pathname) => pathname.startsWith("/demo/journal"),
    },
    {
      href: "/demo/playbook",
      label: "Playbook",
      match: (pathname) => pathname.startsWith("/demo/playbook"),
    },
  ],
};

export function WorkspaceTabs({ variant }: { variant: WorkspaceVariant }) {
  const pathname = usePathname();
  const tabs = tabSets[variant];

  return (
    <div className="overflow-x-auto">
      <nav className="inline-flex min-w-full items-center gap-2 rounded-[24px] border border-white/8 bg-[#2b2d31] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
        {tabs.map((tab) => {
          const isActive = tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[#5865f2] text-white shadow-[0_12px_24px_rgba(88,101,242,0.28)]"
                  : "text-[#b5bac1] hover:bg-white/6 hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
