import Link from "next/link";

const navItems = [
  { href: "/demo", label: "Overview" },
  { href: "/demo/journal", label: "Journal" },
];

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-[28px] border border-white/8 bg-[#2b2d31] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
                Guest Demo
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Synthetic journal data for product walkthroughs
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b5bac1]">
                This route stays fully separate from your private journal. Use
                it to show the product safely or test new UI ideas.
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-2 text-sm font-medium text-[#dbdee1] transition hover:bg-[#111214]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
