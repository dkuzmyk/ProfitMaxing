"use client";

import { useState } from "react";

export function DemoControlsStrip() {
  const [message, setMessage] = useState("");

  const handleClick = () => setMessage("Actions are disabled in demo mode.");

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2d31]">
      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        {/* Add Trade */}
        <button
          type="button"
          aria-disabled="true"
          onClick={handleClick}
          className="flex items-center gap-1.5 rounded-[18px] bg-[#5865f2]/30 px-3.5 py-1.5 text-[13px] font-medium text-[#8a94f0] transition hover:bg-[#5865f2]/40"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Add Trade
        </button>

        {/* Import CSV */}
        <button
          type="button"
          aria-disabled="true"
          onClick={handleClick}
          className="flex items-center gap-1.5 rounded-[18px] border border-white/8 bg-[#1e1f22] px-3.5 py-1.5 text-[13px] font-medium text-[#555860] transition hover:border-white/12 hover:text-[#6d7278]"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 1v7.5M4 6l2.5 2.5L9 6M2 11h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Import CSV
        </button>

        <div className="ml-auto flex items-center gap-4">
          {/* Webull */}
          <button
            type="button"
            aria-disabled="true"
            onClick={handleClick}
            className="flex items-center gap-1.5 text-[11px] text-[#353840] transition hover:text-[#4a4d52]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 4c1.4-1.4 3-2.2 5-2.2s3.6.8 5 2.2M3.5 6.5C4.2 5.8 5 5.5 6 5.5s1.8.3 2.5 1M6 9h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Webull · soon
          </button>

          {/* Broker */}
          <button
            type="button"
            aria-disabled="true"
            onClick={handleClick}
            className="flex items-center gap-1.5 text-[11px] text-[#353840] transition hover:text-[#4a4d52]"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4.5 4.5l3 3M7.5 2l2.5 2.5-1.5 1.5L6 3.5 7.5 2zM2 7.5l2.5 2.5-1.5 1.5L.5 9 2 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Broker · soon
          </button>
        </div>
      </div>

      {message && (
        <p className="border-t border-white/6 px-5 py-2 text-[11px] text-[#6d7278]">{message}</p>
      )}
    </section>
  );
}
