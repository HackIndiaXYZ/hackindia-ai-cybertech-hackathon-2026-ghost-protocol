// Keep in sync with backend/app/schema.py
export type Channel = "upi" | "card" | "netbanking" | "wallet" | "other";
export type ScamType =
  | "digital_arrest" | "upi_refund" | "fake_job"
  | "phishing_link" | "otp_fraud" | "investment" | "other";

export interface Extracted<T> {
  value: T;
  source_quote: string;
  confidence: number; // 0-1
}

export interface Ticket {
  complainant_name: Extracted<string> | null;
  complainant_mobile: Extracted<string> | null;
  incident_datetime: Extracted<string> | null; // ISO 8601
  amount_inr: Extracted<number> | null;
  channel: Extracted<Channel> | null;
  victim_bank: Extracted<string> | null;
  victim_account_hint: Extracted<string> | null;
  transaction_id: Extracted<string> | null;
  beneficiary_upi_id: Extracted<string> | null;
  beneficiary_account: Extracted<string> | null;
  beneficiary_phone: Extracted<string> | null;
  beneficiary_bank: Extracted<string> | null;
  scam_type: Extracted<ScamType> | null;
  narrative: Extracted<string> | null;
  evidence_available: Extracted<string[]> | null;
}

export const REQUIRED_FIELDS = [
  "amount_inr", "incident_datetime", "channel",
  "transaction_id", "victim_bank", "scam_type",
] as const;
export const BENEFICIARY_FIELDS = [
  "beneficiary_upi_id", "beneficiary_account", "beneficiary_phone",
] as const;
