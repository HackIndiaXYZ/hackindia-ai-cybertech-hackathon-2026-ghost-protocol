"use client";

import { useEffect, useRef, useState } from "react";
import GuidanceBar from "@/components/GuidanceBar";
import TicketPanel from "@/components/TicketPanel";
import TranscriptPanel, { type Line } from "@/components/TranscriptPanel";
import { API, addLine, createCase, deleteCase, type Snapshot, type Speaker } from "@/lib/api";
import { SAMPLE_CALL } from "@/lib/sampleCall";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const caseRef = useRef<string | null>(null);
  const cancelRef = useRef(false);

  // Live updates from the backend while a case is open
  useEffect(() => {
    if (!caseId) return;
    const es = new EventSource(`${API}/cases/${caseId}/stream`);
    es.addEventListener("state", (e) => setSnap(JSON.parse((e as MessageEvent).data)));
    es.addEventListener("deleted", () => es.close());
    return () => es.close();
  }, [caseId]);

  async function ensureCase(callStart?: string): Promise<string> {
    if (caseRef.current) return caseRef.current;
    const s = await createCase(callStart);
    caseRef.current = s.case_id;
    setCaseId(s.case_id);
    setSnap(s);
    return s.case_id;
  }

  async function send(speaker: Speaker, text: string, callStart?: string) {
    setBusy(true);
    try {
      const id = await ensureCase(callStart);
      setLines((l) => [...l, { speaker, text }]);
      const s = await addLine(id, speaker, text);
      setSnap(s);
      setError(s.error ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    cancelRef.current = true;
    const id = caseRef.current;
    caseRef.current = null;
    setCaseId(null);
    setSnap(null);
    setLines([]);
    setError(null);
    if (id) {
      try {
        await deleteCase(id);
      } catch {
        /* already gone */
      }
    }
  }

  async function playSample() {
    await reset();
    cancelRef.current = false;
    setPlaying(true);
    const start = new Date().toISOString();
    try {
      for (const line of SAMPLE_CALL) {
        if (cancelRef.current) break;
        await send(line.speaker, line.text, start);
        await sleep(3000);
      }
    } finally {
      setPlaying(false);
    }
  }

  const friendlyError = error
    ? error.includes("503")
      ? "The AI model is busy right now. The ticket will update on the next line."
      : error.includes("Failed to fetch")
        ? `Cannot reach the API at ${API}. Is the backend running?`
        : error
    : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">GoldenHour Desk</h1>
          <p className="text-xs text-slate-500">AI co-pilot for 1930 helpline operators. The operator approves everything.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Concept prototype - synthetic data
        </span>
      </header>

      {friendlyError && (
        <div className="mx-4 mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{friendlyError}</div>
      )}

      <GuidanceBar snap={snap} />

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <TranscriptPanel
          lines={lines}
          busy={busy}
          playing={playing}
          onSend={send}
          onPlay={playSample}
          onStop={() => (cancelRef.current = true)}
          onDelete={reset}
        />
        <TicketPanel snap={snap} />
      </div>
    </main>
  );
}



