"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/api";
import { AlertTriangleIcon, ClockIcon, CopyIcon, CheckIcon, ZapIcon } from "./Icons";

const BADGE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; glow: string; label: string }
> = {
  pending: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    glow: "",
    label: "Pending Assessment",
  },
  critical: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-600",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse",
    label: "CRITICAL: FREEZE NOW",
  },
  high: {
    bg: "bg-amber-500",
    text: "text-white",
    border: "border-amber-600",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    label: "HIGH PRIORITY",
  },
  standard: {
    bg: "bg-emerald-600",
    text: "text-white",
    border: "border-emerald-700",
    glow: "",
    label: "STANDARD PROCESSING",
  },
};

function fmt(ms: number): string {
  const s = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function GuidanceBar({ snap }: { snap: Snapshot | null }) {
  const [now, setNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!snap) return null;
  const q = snap.next_question;
  const tri = snap.triage;
  const remaining = snap.clock && now !== null ? new Date(snap.clock.deadline_at).getTime() - now : null;
  const badge = tri ? BADGE_CONFIG[tri.level] ?? BADGE_CONFIG.pending : BADGE_CONFIG.pending;

  // Percentage of 60 min left (from 100% down to 0%)
  const sixtyMinMs = 60 * 60 * 1000;
  const percentLeft = remaining !== null ? Math.max(0, Math.min(100, (remaining / sixtyMinMs) * 100)) : 100;

  function copyQuestion() {
    if (!q) return;
    navigator.clipboard.writeText(q.hinglish);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-4 mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_1.1fr]">
      {/* 1. Next Question Recommendation */}
      <div className="relative overflow-hidden rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white p-3.5 shadow-xs transition-all hover:border-blue-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
              <ZapIcon className="h-3 w-3" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
              Co-Pilot Next Question
            </span>
          </div>
          {q && (
            <button
              onClick={copyQuestion}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-blue-700 shadow-2xs hover:bg-blue-50 active:scale-95"
              title="Copy question text to clipboard"
            >
              {copied ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <CopyIcon className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>

        {q ? (
          <div className="mt-2 space-y-0.5">
            <p className="text-sm font-semibold text-slate-900 leading-snug">
              &ldquo;{q.hinglish}&rdquo;
            </p>
            <p className="text-xs text-slate-500">{q.english}</p>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center gap-2 text-emerald-700">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-sm font-semibold">All required intelligence gathered. Ready for freeze submission.</p>
          </div>
        )}
      </div>

      {/* 2. Triage & Risk Level */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Helpline Triage
          </span>
          <AlertTriangleIcon className="h-3.5 w-3.5 text-slate-400" />
        </div>

        {tri ? (
          <div className="mt-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${badge.bg} ${badge.text} ${badge.glow}`}
            >
              {tri.level === "critical" && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
              {badge.label}
            </span>
            <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">{tri.reason}</p>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Awaiting call details...</p>
        )}
      </div>

      {/* 3. Golden Hour Emergency Clock */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Golden Hour Window
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Target: &lt;60 min</span>
        </div>

        {remaining === null ? (
          <div className="mt-2">
            <p className="text-xl font-bold text-slate-300 tabular-nums">--:--</p>
            <p className="text-[11px] text-slate-400">Awaiting incident timestamp</p>
          </div>
        ) : remaining >= 0 ? (
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between">
              <span
                className={`text-2xl font-black tabular-nums tracking-tight ${
                  remaining < 15 * 60000 ? "text-red-600 animate-pulse" : "text-slate-900"
                }`}
              >
                {fmt(remaining)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">remaining</span>
            </div>
            {/* Visual countdown progress track */}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-1000 ${
                  remaining < 15 * 60000 ? "bg-red-500" : remaining < 30 * 60000 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${percentLeft}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between text-red-600">
              <span className="text-2xl font-black tabular-nums tracking-tight">+{fmt(remaining)}</span>
              <span className="text-[11px] font-bold uppercase">Overdue</span>
            </div>
            <p className="text-[11px] text-red-500">High risk of mule account hops</p>
          </div>
        )}

        {/* RBI Customer Liability Rules (from Synopsis Section 5 & 7) */}
        {snap.clock?.rbi_window && (
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-600">RBI Rules:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide border ${
                  snap.clock.rbi_window.tier === "zero_liability"
                    ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                    : snap.clock.rbi_window.tier === "limited_liability"
                    ? "text-amber-800 bg-amber-50 border-amber-200"
                    : "text-red-800 bg-red-50 border-red-200"
                }`}
              >
                {snap.clock.rbi_window.text}
              </span>
            </div>
            <p className="mt-1 text-[9px] text-slate-400 leading-tight" title={snap.clock.rbi_window.caution}>
              {snap.clock.rbi_window.caution}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
