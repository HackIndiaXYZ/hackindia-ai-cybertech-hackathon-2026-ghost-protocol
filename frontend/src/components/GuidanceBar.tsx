"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/api";

const BADGE: Record<string, string> = {
  pending: "bg-slate-200 text-slate-700",
  critical: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  standard: "bg-green-600 text-white",
};

function fmt(ms: number): string {
  const s = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function GuidanceBar({ snap }: { snap: Snapshot | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!snap) return null;
  const q = snap.next_question;
  const tri = snap.triage;
  const remaining = snap.clock && now !== null ? new Date(snap.clock.deadline_at).getTime() - now : null;

  return (
    <div className="mx-4 mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Ask next</p>
        {q ? (
          <>
            <p className="mt-1 text-sm font-semibold">{q.hinglish}</p>
            <p className="text-xs text-slate-600">{q.english}</p>
          </>
        ) : (
          <p className="mt-1 text-sm font-semibold text-green-700">Nothing left to ask. Review and submit.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Triage</p>
        {tri && (
          <>
            <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase ${BADGE[tri.level]}`}>
              {tri.level}
            </span>
            <p className="mt-1 text-xs text-slate-600">{tri.reason}</p>
          </>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Golden hour</p>
        {remaining === null ? (
          <p className="mt-1 text-sm text-slate-400">Waiting for incident time</p>
        ) : remaining >= 0 ? (
          <p className={`mt-1 text-2xl font-bold tabular-nums ${remaining < 10 * 60000 ? "text-red-600" : "text-slate-900"}`}>
            {fmt(remaining)}
          </p>
        ) : (
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">Overdue {fmt(remaining)}</p>
        )}
      </div>
    </div>
  );
}

