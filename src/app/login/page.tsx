import Link from "next/link";

import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-[#949ba4]">
            Personal Access
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Sign in to your journal
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#b5bac1]">
            Use this flow for your real workspace. If you only want to explore
            the interface, switch to the guest demo instead.
          </p>

          <form action={signIn} className="flex flex-col gap-5">
            <div className="mt-8">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#dbdee1]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2] focus:bg-[#1a1b1f]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#dbdee1]"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#1e1f22] px-4 py-3 text-white outline-none transition placeholder:text-[#6d7278] focus:border-[#5865f2] focus:bg-[#1a1b1f]"
                placeholder="Your password"
              />
            </div>

            {message ? (
              <div className="rounded-2xl border border-[#f0b232]/20 bg-[#f0b232]/10 px-4 py-3 text-sm text-[#f5c96a]">
                {message}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                className="rounded-2xl bg-[#5865f2] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4752c4]"
              >
                Sign in
              </button>

              <Link
                href="/demo"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-medium text-[#dbdee1] transition hover:bg-white/10"
              >
                Continue as guest instead
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
