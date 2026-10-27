import type { Snapshot } from "@/lib/api";
import type { Extracted, Ticket } from "@/lib/ticket";

type Key = keyof Ticket;

const LABELS: Record<Key, string> = {
  complainant_name: "Name",
  complainant_mobile: "Mobile",
  incident_datetime: "Incident time",
  amount_inr: "Amount",
  channel: "Channel",
  victim_bank: "Victim's bank",
  victim_account_hint: "Account (last 4)",
  transaction_id: "Transaction ID (UTR)",
  beneficiary_upi_id: "UPI ID",
  beneficiary_account: "Account number",
  beneficiary_phone: "Phone",
  beneficiary_bank: "Bank",
  scam_type: "Scam type",
  narrative: "Narrative",
  evidence_available: "Evidence",
};

const GROUPS: { title: string; keys: Key[] }[] = [
  { title: "Complainant", keys: ["complainant_name", "complainant_mobile"] },
  {
    title: "Incident",
    keys: ["incident_datetime", "amount_inr", "channel", "victim_bank", "victim_account_hint", "transaction_id", "scam_type"],
  },
  {
    title: "Fraudster (who received the money)",
    keys: ["beneficiary_upi_id", "beneficiary_account", "beneficiary_phone", "beneficiary_bank"],
  },
  { title: "Summary", keys: ["narrative", "evidence_available"] },
];

function format(key: Key, value: unknown): string {
  if (key === "amount_inr" && typeof value === "number") return `\u20B9${value.toLocaleString("en-IN")}`;
  if (key === "incident_datetime" && typeof value === "string") {
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function dot(confidence: number): string {
  if (confidence >= 0.85) return "bg-green-500";
  if (confidence >= 0.6) return "bg-amber-500";
  return "bg-red-500";
}

function Row({ fieldKey, field, missing }: { fieldKey: Key; field: Extracted<unknown> | null; missing: boolean }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="w-40 shrink-0 text-sm text-slate-500">{LABELS[fieldKey]}</span>
      <div className="flex-1 text-sm">
        {field ? (
          <span className="group relative inline-flex items-start gap-2">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot(field.confidence)}`} />
            <span className="font-medium">{format(fieldKey, field.value)}</span>
            <span className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden w-72 rounded-md bg-slate-900 p-2 text-xs text-white shadow-lg group-hover:block">
              <span className="block text-slate-300">
                Source quote - confidence {Math.round(field.confidence * 100)}%
              </span>
              &ldquo;{field.source_quote}&rdquo;
            </span>
          </span>
        ) : missing ? (
          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">MISSING</span>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </div>
    </div>
  );
}

export default function TicketPanel({ snap }: { snap: Snapshot | null }) {
  const missing = snap?.missing ?? [];
  return (
    <section className="h-[calc(100vh-15rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="font-semibold">Live complaint ticket</h2>
        {snap &&
          (snap.ready ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Ready to submit</span>
          ) : (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {missing.length} required missing
            </span>
          ))}
      </div>

      {!snap ? (
        <p className="p-4 text-sm text-slate-500">No active case. The ticket fills in here as the call goes on.</p>
      ) : (
        <div className="space-y-4 p-4">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{g.title}</h3>
              {g.title.startsWith("Fraudster") && missing.includes("beneficiary_identifier") && (
                <p className="mb-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                  MISSING - need at least one of UPI ID, account number or phone
                </p>
              )}
              {g.keys.map((k) => (
                <Row key={k} fieldKey={k} field={snap.ticket[k]} missing={missing.includes(k)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

