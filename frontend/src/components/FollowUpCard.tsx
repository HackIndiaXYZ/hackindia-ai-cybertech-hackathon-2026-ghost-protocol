"use client";

import { useEffect, useState } from "react";
import { approveDraft, createDraft, type Snapshot } from "@/lib/api";
import { CheckCircleIcon, CopyIcon, CheckIcon, SparklesIcon, SendIcon, LockIcon } from "./Icons";

export default function FollowUpCard({ snap }: { snap: Snapshot | null }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const serverText = snap?.draft?.text ?? "";
  useEffect(() => {
    setText(serverText);
  }, [serverText]);

  if (!snap) return null;

  const approved = !!snap.draft?.approved_at;
  const hasDraft = !!snap.draft?.text;
  const source = snap.draft?.source;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await action();
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setErr("Could not copy. Select the text and copy manually.");
    }
  }

  const badge = approved
    ? { label: "Approved by Officer", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" }
    : hasDraft
      ? {
          label: source === "ai" ? "AI-Polished Draft" : "Template Draft",
          cls: "bg-blue-100 text-blue-800 border-blue-200",
        }
      : { label: "Awaiting Ticket Readiness", cls: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <section className="mx-4 mb-6 rounded-xl border border-slate-200/90 bg-white shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Complainant Evidence Preservation Advisory</h2>
            <p className="text-[11px] text-slate-500">
              Instant bilingual (English + Hinglish) SMS/WhatsApp instructions sent to the victim.
            </p>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => run(() => createDraft(snap.case_id))}
            disabled={!snap.ready || busy || approved}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 transition-all active:scale-95"
            title="Generate personalized follow-up message using complaint facts"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>{busy ? "Generating..." : hasDraft ? "Regenerate Draft" : "Draft Follow-Up"}</span>
          </button>

          {hasDraft && (
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : <CopyIcon className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Advisory"}</span>
            </button>
          )}

          {hasDraft && !approved && (
            <button
              onClick={() => run(() => approveDraft(snap.case_id, text))}
              disabled={busy || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-40 transition-all active:scale-95"
            >
              <CheckCircleIcon className="h-3.5 w-3.5" />
              <span>Approve & Authorize</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {err && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            {err}
          </div>
        )}

        {!hasDraft ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
            <LockIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {snap.ready ? "Ticket Intelligence Complete" : "Ticket Incomplete"}
            </h4>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              {snap.ready
                ? "All critical fraud trail facts are validated. Click 'Draft Follow-Up' above to prepare the evidence advisory for the caller."
                : "The follow-up advisory becomes available once all required fields (Amount, UTR, Beneficiary Identifier) are collected."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                readOnly={approved}
                rows={12}
                placeholder="Follow-up advisory text..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3.5 font-mono text-xs leading-relaxed text-slate-900 shadow-inner focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden read-only:bg-slate-50/80"
              />
              {approved && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircleIcon className="h-3 w-3" />
                  LOCKED & APPROVED
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>
                {approved
                  ? `Approved at ${new Date(snap.draft!.approved_at!).toLocaleTimeString("en-IN")}`
                  : "Operator may edit message above prior to approval."}
              </span>
              <span>{text.length} characters</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
