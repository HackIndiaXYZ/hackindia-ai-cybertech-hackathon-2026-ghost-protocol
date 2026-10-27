import type { Ticket } from "./ticket";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Speaker = "Victim" | "Operator";

export interface Snapshot {
  case_id: string;
  version: number;
  ticket: Ticket;
  missing: string[];
  ready: boolean;
  error?: string | null;
  rejected?: string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const createCase = (callStart?: string) =>
  request<Snapshot>("/cases", {
    method: "POST",
    body: JSON.stringify(callStart ? { call_start: callStart } : {}),
  });

export const addLine = (caseId: string, speaker: Speaker, text: string) =>
  request<Snapshot>(`/cases/${caseId}/lines`, {
    method: "POST",
    body: JSON.stringify({ speaker, text }),
  });

export const deleteCase = (caseId: string) =>
  request<void>(`/cases/${caseId}`, { method: "DELETE" });
