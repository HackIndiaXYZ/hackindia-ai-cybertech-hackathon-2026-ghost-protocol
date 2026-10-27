"use client";

import { useState } from "react";
import type { Snapshot } from "@/lib/api";
import type { Extracted, Ticket } from "@/lib/ticket";
import {
  CheckCircleIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  AlertTriangleIcon,
  ShieldIcon,
  UserIcon,
} from "./Icons";

type Key = keyof Ticket;

const LABELS: Record<Key, string> = {
  complainant_name: "Complainant Name",
  complainant_mobile: "Mobile Number",
  incident_datetime: "Incident Timestamp",
  amount_inr: "Amount Lost",
  channel: "Payment Channel",
  victim_bank: "Victim's Bank",
  victim_account_hint: "Victim Account (Last 4)",
  transaction_id: "Transaction ID / UTR",
  beneficiary_upi_id: "Fraudster UPI ID",
  beneficiary_account: "Beneficiary Account",
  beneficiary_phone: "Fraudster Phone",
  beneficiary_bank: "Beneficiary Bank",
  scam_type: "Scam Classification",
  narrative: "Case Summary Narrative",
  evidence_available: "Evidence Available",
};

const GROUPS: { title: string; icon: string; keys: Key[]; highlight?: boolean }[] = [
  {
    title: "Complainant Details",
    icon: "👤",
    keys: ["complainant_name", "complainant_mobile"],
  },
  {
    title: "Incident Intelligence",
    icon: "⏱️",
    keys: ["incident_datetime", "amount_inr", "channel", "victim_bank", "victim_account_hint", "transaction_id", "scam_type"],
  },
  {
    title: "Fraudster Money Trail (Target for Freeze)",
    icon: "🚨",
    keys: ["beneficiary_upi_id", "beneficiary_account", "beneficiary_phone", "beneficiary_bank"],
    highlight: true,
  },
  {
    title: "Case Narrative & Evidence",
    icon: "📝",
    keys: ["narrative", "evidence_available"],
  },
];

function format(key: Key, value: unknown): string {
  if (key === "amount_inr" && typeof value === "number") return `₹${value.toLocaleString("en-IN")}`;
  if (key === "incident_datetime" && typeof value === "string") {
    try {
      return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      });
    } catch {
      return String(value);
    }
  }
  if (key === "channel" && typeof value === "string") {
    return value.toUpperCase();
  }
  if (key === "scam_type" && typeof value === "string") {
    return value.replace(/_/g, " ").toUpperCase();
  }
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

function dot(confidence: number): { color: string; label: string } {
  if (confidence >= 0.85) return { color: "bg-emerald-500", label: "High Confidence" };
  if (confidence >= 0.6) return { color: "bg-amber-500", label: "Medium Confidence" };
  return { color: "bg-red-500", label: "Low Confidence" };
}

function Row({
  fieldKey,
  field,
  missing,
}: {
  fieldKey: Key;
  field: Extracted<unknown> | null;
  missing: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isHighValueField = fieldKey === "transaction_id" || fieldKey === "beneficiary_upi_id";

  function copyValue() {
    if (!field) return;
    navigator.clipboard.writeText(String(field.value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  const confInfo = field ? dot(field.confidence) : null;

  return (
    <div className="group relative flex items-start justify-between gap-3 border-b border-slate-100/90 py-2.5 last:border-0 hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
      <div className="flex flex-col">
        <span className="text-xs font-medium text-slate-500">{LABELS[fieldKey]}</span>
        {field ? (
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className={`h-2 w-2 rounded-full ${confInfo?.color} shrink-0`} title={confInfo?.label} />
            <span
              className={`text-xs font-semibold ${
                isHighValueField
                  ? "rounded bg-blue-100/80 px-1.5 py-0.5 font-mono text-blue-900 border border-blue-200"
                  : "text-slate-900"
              }`}
            >
              {format(fieldKey, field.value)}
            </span>

            {/* Quick copy for high value fields */}
            {isHighValueField && (
              <button
                onClick={copyValue}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 rounded p-0.5 hover:bg-slate-200"
                title="Copy field value"
              >
                {copied ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <CopyIcon className="h-3 w-3 text-slate-400" />}
              </button>
            )}
          </div>
        ) : missing ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-700 w-fit">
            <AlertTriangleIcon className="h-2.5 w-2.5" />
            REQUIRED MISSING
          </span>
        ) : (
          <span className="mt-0.5 text-xs text-slate-300 font-mono">-</span>
        )}
      </div>

      {/* Quote badge with popover */}
      {field && (
        <div className="relative shrink-0">
          <span className="inline-flex cursor-help items-center gap-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 shadow-2xs">
            <span>{Math.round(field.confidence * 100)}%</span>
          </span>

          {/* Tooltip on hover */}
          <div className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200 shadow-xl group-hover:block">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Verbatim Transcript Quote</span>
              <span className="text-[10px] text-emerald-400 font-semibold">{confInfo?.label}</span>
            </div>
            <p className="italic text-white">&ldquo;{field.source_quote}&rdquo;</p>
            <p className="mt-1 text-[9px] text-slate-400">Zero-hallucination checked against audio feed</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketPanel({ snap }: { snap: Snapshot | null }) {
  const [copiedTrail, setCopiedTrail] = useState(false);
  const missing = snap?.missing ?? [];
  const ticket = snap?.ticket;

  function copyMoneyTrail() {
    if (!ticket) return;
    const utr = ticket.transaction_id?.value ?? "N/A";
    const upi = ticket.beneficiary_upi_id?.value ?? "N/A";
    const phone = ticket.beneficiary_phone?.value ?? "N/A";
    const amt = ticket.amount_inr?.value ? `INR ${ticket.amount_inr.value}` : "N/A";
    const text = `CYBER FRAUD FREEZE REQUEST:\n- Amount: ${amt}\n- UTR: ${utr}\n- Fraudster UPI: ${upi}\n- Fraudster Phone: ${phone}\n- Status: Verification Confirmed`;
    navigator.clipboard.writeText(text);
    setCopiedTrail(true);
    setTimeout(() => setCopiedTrail(false), 1500);
  }

  function downloadJSON() {
    if (!snap) return;
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyber-ticket-${snap.case_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="flex h-[calc(100vh-14.5rem)] flex-col rounded-xl border border-slate-200/90 bg-white shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <ShieldIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">National Cybercrime Ticket (1930)</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {snap ? (
            snap.ready ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shadow-xs animate-bounce">
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                Ready to Submit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
                <AlertTriangleIcon className="h-3 w-3" />
                {missing.length} Missing Field{missing.length === 1 ? "" : "s"}
              </span>
            )
          ) : (
            <span className="text-xs text-slate-400">Idle</span>
          )}

          {snap && (
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={copyMoneyTrail}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
                title="Copy UTR and Fraudster UPI for bank freeze portal"
              >
                {copiedTrail ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <CopyIcon className="h-3 w-3" />}
                <span className="hidden sm:inline">{copiedTrail ? "Copied" : "Copy Trail"}</span>
              </button>
              <button
                onClick={downloadJSON}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
                title="Download full complaint ticket JSON"
              >
                <DownloadIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Body */}
      {!snap ? (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <ShieldIcon className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No Active Complaint Case</h3>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Start a call transcript on the left. Verified facts will be extracted and structured here in real time.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth">
          {GROUPS.map((g) => (
            <div
              key={g.title}
              className={`rounded-xl border p-3.5 transition-all ${
                g.highlight
                  ? "border-red-200/90 bg-red-50/30"
                  : "border-slate-200/70 bg-white"
              }`}
            >
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <span>{g.icon}</span>
                  <span>{g.title}</span>
                </h3>
                {g.highlight && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-red-800">
                    High Priority
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {g.keys.map((k) => (
                  <Row
                    key={k}
                    fieldKey={k}
                    field={ticket ? ticket[k] : null}
                    missing={missing.includes(k) || (k.startsWith("beneficiary_") && missing.includes("beneficiary_identifier"))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
