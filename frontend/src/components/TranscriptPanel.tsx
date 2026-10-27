"use client";

import { useEffect, useRef, useState } from "react";
import type { Speaker } from "@/lib/api";
import {
  HeadphonesIcon,
  PhoneCallIcon,
  PlayIcon,
  RotateCcwIcon,
  Trash2Icon,
  SendIcon,
  ZapIcon,
  UserIcon,
} from "./Icons";

import { SCENARIOS } from "@/lib/sampleCall";

export interface Line {
  speaker: Speaker;
  text: string;
}

interface Props {
  lines: Line[];
  busy: boolean;
  playing: boolean;
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  onSend: (speaker: Speaker, text: string) => void;
  onPlay: () => void;
  onReplay: () => void;
  onStop: () => void;
  onDelete: () => void;
}

const QUICK_PROMPTS = [
  { label: "Ask UTR", text: "Payment app kholiye, transaction details mein 12 digit ka UTR hota hai." },
  { label: "Ask Beneficiary", text: "Jisko paise gaye, uski UPI ID, account number ya phone number bataiye." },
  { label: "Ask Bank", text: "Aapka bank kaunsa hai aur payment kaise gaya?" },
  { label: "Calm Victim", text: "Shaant rahiye, poori baat bataiye. Hum account freeze ki request daal rahe hain." },
];

export default function TranscriptPanel({
  lines,
  busy,
  playing,
  selectedScenarioId,
  onSelectScenario,
  onSend,
  onPlay,
  onReplay,
  onStop,
  onDelete,
}: Props) {
  const [speaker, setSpeaker] = useState<Speaker>("Victim");
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  function submit() {
    const t = text.trim();
    if (!t || busy || playing) return;
    onSend(speaker, t);
    setText("");
  }

  function handleQuickPrompt(promptText: string) {
    if (playing) return;
    setSpeaker("Operator");
    setText(promptText);
  }

  return (
    <section className="flex h-[calc(100vh-14.5rem)] flex-col rounded-xl border border-slate-200/90 bg-white shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <PhoneCallIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Audio & Transcript Feed</h2>
              {playing ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  CALL LIVE
                </span>
              ) : lines.length > 0 ? (
                <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {lines.length} turns recorded
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">On Hook</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {playing ? (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-amber-600 active:scale-95 transition-all"
            >
              Stop
            </button>
          ) : (
            <>
              <button
                onClick={onReplay}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
                title="Instant zero-API replay of the full sample call"
              >
                <ZapIcon className="h-3.5 w-3.5 text-yellow-300" />
                <span>Replay Demo</span>
              </button>
              <button
                onClick={onPlay}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                title="Live call with real-time Gemini structured extraction"
              >
                <PlayIcon className="h-3 w-3 text-slate-600" />
                <span>Live AI</span>
              </button>
            </>
          )}

          <button
            onClick={onDelete}
            disabled={playing || lines.length === 0}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 transition-all"
            title="Reset active case and clear transcript"
          >
            <Trash2Icon className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Multilingual Scenario Selector (from Synopsis) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/60 bg-slate-50/60 px-3 py-1.5 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Preset:
        </span>
        {SCENARIOS.map((sc) => {
          const isSelected = selectedScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              disabled={playing}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{sc.title}</span>
              <span className={`ml-1.5 text-[10px] px-1 py-0.2 rounded font-normal ${isSelected ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                {sc.language}
              </span>
            </button>
          );
        })}
      </div>

      {/* Transcript Log */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 scroll-smooth">
        {lines.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
              <PhoneCallIcon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Helpline Stream Ready</h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Click <strong className="text-blue-700">&ldquo;Replay Demo&rdquo;</strong> to simulate the 14-turn OLX UPI scam call, or type manually below.
            </p>
          </div>
        )}

        {lines.map((l, i) => {
          const isVictim = l.speaker === "Victim";
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 transition-all duration-200 ${
                isVictim ? "flex-row" : "flex-row"
              }`}
            >
              {/* Speaker Avatar */}
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs ${
                  isVictim
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-blue-600 text-white shadow-blue-200"
                }`}
              >
                {isVictim ? <UserIcon className="h-3.5 w-3.5" /> : <HeadphonesIcon className="h-3.5 w-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm shadow-2xs leading-relaxed ${
                  isVictim
                    ? "border border-amber-200/80 bg-amber-50/50 text-slate-800"
                    : "border border-blue-200/80 bg-blue-50/60 text-slate-900"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isVictim ? "text-amber-800" : "text-blue-700"
                    }`}
                  >
                    {isVictim ? "Caller (Victim)" : "1930 Officer"}
                  </span>
                  <span className="text-[10px] text-slate-400">Turn #{i + 1}</span>
                </div>
                <p className="whitespace-pre-wrap">{l.text}</p>
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-blue-600 p-2 rounded-lg bg-blue-50/50 border border-blue-100 animate-pulse">
            <ZapIcon className="h-3.5 w-3.5 animate-spin" />
            <span>AI Co-Pilot analyzing transcript & updating ticket facts...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick Prompts Helper */}
      {!playing && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-100 bg-slate-50/50 px-3 py-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Quick Operator Phrases:</span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(qp.text)}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              + {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5">
        <select
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value as Speaker)}
          disabled={playing}
          className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-blue-500 focus:outline-hidden"
        >
          <option value="Victim">Victim</option>
          <option value="Operator">Operator</option>
        </select>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={playing}
          placeholder={
            playing
              ? "Call in progress... controls disabled"
              : `Type a line as ${speaker} (or press Enter)...`
          }
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
        />

        <button
          onClick={submit}
          disabled={busy || playing || !text.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-black disabled:opacity-40 transition-all active:scale-95"
        >
          <SendIcon className="h-3 w-3" />
          <span>Send</span>
        </button>
      </div>
    </section>
  );
}
