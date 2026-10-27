"use client";

import { useEffect, useState } from "react";
import { approveDraft, createDraft, type Snapshot } from "@/lib/api";

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
      setErr("Could not copy. Select the text and copy it by hand.");
    }
  }

  const badge = approved
    ? { label: "Approved", cls: "bg-green-100 text-green-800" }
    : hasDraft
      ? { label: source === "ai" ? "Draft (AI-polished)" : "Draft (template)", cls: "bg-amber-100 text-amber-800" }
      : { label: "No draft", cls: "bg-slate-200 text-slate-700" };

  return (
    <section className="mx-4 mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">Follow-up message to the complainant</h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => run(() => createDraft(snap.case_id))}
            disabled={!snap.ready || busy || approved}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Working..." : hasDraft ? "Redraft" : "Draft follow-up"}
          </button>
          {hasDraft && (
            <button onClick={copy} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
              {copied ? "Copied" : "Copy message"}
            </button>
          )}
          {hasDraft && !approved && (
            <button
              onClick={() => run(() => approveDraft(snap.case_id, text))}
              disabled={busy || !text.trim()}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {err && <p className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        {!hasDraft ? (
          <p className="text-sm text-slate-500">
            {snap.ready
              ? "The ticket is ready. Press Draft follow-up to prepare a message. Nothing is sent without your approval."
              : "Available once the ticket shows Ready to submit."}
          </p>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              readOnly={approved}
              rows={14}
              className="w-full rounded-md border border-slate-300 p-3 text-sm leading-relaxed read-only:bg-slate-50"
            />
            <p className="mt-2 text-xs text-slate-500">
              {approved
                ? "Approved by the operator. In this prototype nothing is actually sent: use Copy message to share it."
                : "Edit the text if needed, then press Approve. Nothing is sent in this prototype."}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
