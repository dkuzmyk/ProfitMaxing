"use client";

import { useState } from "react";

const controlItems = [
  "Add trade",
  "CSV import soon",
  "Webull sync soon",
  "Broker sync soon",
] as const;

export function DemoControlsStrip() {
  const [message, setMessage] = useState("");

  return (
    <section className="rounded-[28px] border border-white/8 bg-[#2b2d31] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
      <div className="grid gap-3 md:grid-cols-4">
        {controlItems.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-disabled="true"
            onClick={() => setMessage("Disabled in demo mode.")}
            className={
              index === 0
                ? "rounded-[22px] bg-[#5865f2]/45 px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5865f2]/55"
                : "rounded-[22px] border border-white/10 bg-[#1e1f22] px-4 py-3 text-sm font-medium text-[#8f949b] transition hover:bg-white/6 hover:text-[#c9ced6]"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mt-3 text-sm text-[#949ba4]">{message}</p>
      ) : null}
    </section>
  );
}
