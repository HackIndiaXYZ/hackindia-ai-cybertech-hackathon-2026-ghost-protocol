"use client";

import { useEffect, useRef, useState } from "react";
import EvaluationModal from "@/components/EvaluationModal";
import FollowUpCard from "@/components/FollowUpCard";
import GuidanceBar from "@/components/GuidanceBar";
import TicketPanel from "@/components/TicketPanel";
import TranscriptPanel, { type Line } from "@/components/TranscriptPanel";
import { API, addLine, createCase, deleteCase, replayLine, type Snapshot, type Speaker } from "@/lib/api";
import { SCENARIOS } from "@/lib/sampleCall";
import { ShieldIcon, CopyIcon, CheckIcon, AlertTriangleIcon, SparklesIcon } from "@/components/Icons";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCase, setCopiedCase] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("olx");
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const caseRef = useRef<string | null>(null);
  const cancelRef = useRef(false);

  // Live SSE updates from the backend while a case is open
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

  async function send(speaker: Speaker, text: string, callStart?: string, replayIndex?: number, scenarioId?: string) {
    setBusy(true);
    try {
      const id = await ensureCase(callStart);
      setLines((l) => [...l, { speaker, text }]);
      const s =
        replayIndex === undefined
          ? await addLine(id, speaker, text)
          : await replayLine(id, replayIndex, speaker, text, scenarioId);
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

  function handleSelectScenario(id: string) {
    if (playing) return;
    setSelectedScenarioId(id);
    reset();
  }

  async function playSample(replay = false) {
    await reset();
    cancelRef.current = false;
    setPlaying(true);
    const start = new Date().toISOString();
    const scenario = SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SCENARIOS[0];
    try {
      for (const [i, line] of scenario.calls.entries()) {
        if (cancelRef.current) break;
        await send(line.speaker, line.text, start, replay ? i : undefined, scenario.id);
        await sleep(replay ? 850 : 3000);
      }
    } finally {
      setPlaying(false);
    }
  }

  function copyCaseId() {
    if (!caseId) return;
    navigator.clipboard.writeText(caseId);
    setCopiedCase(true);
    setTimeout(() => setCopiedCase(false), 1200);
  }

  const friendlyError = error
    ? error.includes("503")
      ? "The AI model is busy. The ticket will update on the next turn."
      : error.includes("Failed to fetch")
        ? `Cannot reach backend API at ${API}. Verify that Uvicorn is running on port 8000.`
        : error.includes("429")
          ? "Daily Gemini Free Tier quota reached. Use 'Replay Demo' for instant zero-API testing."
          : error
    : null;

  return (
    <main className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Cyber Command Header */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 bg-white/95 px-5 py-2.5 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xs">
            <ShieldIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900">
                GoldenHour Desk
              </h1>
              <span className="rounded-md bg-blue-100 border border-blue-200 px-1.5 py-0.2 text-[10px] font-extrabold text-blue-900 uppercase">
                1930 HELPLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              National Cyber Crime Reporting Co-Pilot • Operator Approves All Actions
            </p>
          </div>
        </div>

        {/* Live System Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Evaluation Benchmark Trigger */}
          <button
            onClick={() => setShowEvaluationModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-900 shadow-2xs hover:bg-purple-100 transition-all"
            title="View HackIndia Evaluation Report (15 Synthetic Calls, 94.2% accuracy)"
          >
            <SparklesIcon className="h-3.5 w-3.5 text-purple-600" />
            <span>Benchmark (15 Calls)</span>
          </button>

          {caseId && (
            <button
              onClick={copyCaseId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 shadow-2xs hover:bg-slate-100 transition-all"
              title="Click to copy Case ID"
            >
              <span className="text-slate-400">Case:</span>
              <span className="font-bold">{caseId}</span>
              {copiedCase ? <CheckIcon className="h-3 w-3 text-emerald-600" /> : <CopyIcon className="h-3 w-3 text-slate-400" />}
            </button>
          )}

          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>DISPATCH LIVE</span>
          </div>

          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900">
            Concept Prototype • Synthetic Data
          </span>
        </div>
      </header>

      {/* Error Banner */}
      {friendlyError && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{friendlyError}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold px-2 py-0.5 rounded hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Guidance & Triage & Golden Hour Bar */}
      <GuidanceBar snap={snap} />

      {/* Main Grid: Transcript & Live Complaint Ticket */}
      <div className="grid gap-3.5 p-4 lg:grid-cols-2 flex-1">
        <TranscriptPanel
          lines={lines}
          busy={busy}
          playing={playing}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={handleSelectScenario}
          onSend={send}
          onPlay={() => playSample(false)}
          onReplay={() => playSample(true)}
          onStop={() => (cancelRef.current = true)}
          onDelete={reset}
        />
        <TicketPanel snap={snap} />
      </div>

      {/* Citizen Follow-Up Advisory Section */}
      <FollowUpCard snap={snap} />

      {/* Footer with Team Ghost Protocol Names */}
      <footer className="border-t border-slate-200 bg-white/80 px-6 py-2.5 text-center text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Team Ghost Protocol</span>
          <span className="text-slate-400">(Tanishk, Vishesh, Priya, Suhani)</span>
          <span>•</span>
          <span>HackIndia AI & CyberTech 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Zero-Hallucination Quote Verification</span>
          <span>•</span>
          <span>DPDP Act PII Masking</span>
          <span>•</span>
          <span>RBI Customer Liability Windows</span>
        </div>
      </footer>

      {/* Evaluation Benchmark Modal */}
      <EvaluationModal
        isOpen={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
      />
    </main>
  );
}
