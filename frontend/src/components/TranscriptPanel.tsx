"use client";

import { useEffect, useRef, useState } from "react";
import type { Speaker } from "@/lib/api";

export interface Line {
  speaker: Speaker;
  text: string;
}

interface Props {
  lines: Line[];
  busy: boolean;
  playing: boolean;
  onSend: (speaker: Speaker, text: string) => void;
  onPlay: () => void;
  onStop: () => void;
  onDelete: () => void;
}

export default function TranscriptPanel({ lines, busy, playing, onSend, onPlay, onStop, onDelete }: Props) {
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

  return (
    <section className="flex h-[calc(100vh-9rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">Call transcript</h2>
        <div className="flex gap-2">
          {playing ? (
            <button onClick={onStop} className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-300">
              Stop
            </button>
          ) : (
            <button onClick={onPlay} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              Play sample call
            </button>
          )}
          <button onClick={onDelete} className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50">
            Delete case
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {lines.length === 0 && (
          <p className="text-sm text-slate-500">
            No call yet. Press Play sample call, or type a line below as Victim or Operator.
          </p>
        )}
        {lines.map((l, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${l.speaker === "Victim" ? "bg-slate-100" : "bg-blue-50"}`}
          >
            <span className="mr-2 font-semibold">{l.speaker}:</span>
            {l.text}
          </div>
        ))}
        {busy && <p className="text-xs text-slate-500">Updating ticket...</p>}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 border-t border-slate-200 p-3">
        <select
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value as Speaker)}
          disabled={playing}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option>Victim</option>
          <option>Operator</option>
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={playing}
          placeholder="Type or paste a line, then press Enter"
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          onClick={submit}
          disabled={busy || playing}
          className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </section>
  );
}
