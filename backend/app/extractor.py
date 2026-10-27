"""extract(): transcript -> Ticket, using Gemini structured output.

The model only EXTRACTS. Our own code then checks every quote against the
transcript and validates every value, so an invented field gets dropped.
"""
import os
import re
from datetime import datetime, timedelta, timezone
from enum import Enum
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.schema import Ticket

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

IST = timezone(timedelta(hours=5, minutes=30))


class FieldName(str, Enum):
    complainant_name = "complainant_name"
    complainant_mobile = "complainant_mobile"
    incident_datetime = "incident_datetime"
    amount_inr = "amount_inr"
    channel = "channel"
    victim_bank = "victim_bank"
    victim_account_hint = "victim_account_hint"
    transaction_id = "transaction_id"
    beneficiary_upi_id = "beneficiary_upi_id"
    beneficiary_account = "beneficiary_account"
    beneficiary_phone = "beneficiary_phone"
    beneficiary_bank = "beneficiary_bank"
    scam_type = "scam_type"
    narrative = "narrative"
    evidence_available = "evidence_available"


class ExtractedItem(BaseModel):
    name: FieldName
    value: str
    source_quote: str
    confidence: float


class Extraction(BaseModel):
    items: list[ExtractedItem]


SYSTEM_PROMPT = """You extract facts for a cyber-fraud complaint ticket from a call transcript between a helpline Operator and a fraud Victim. Languages: Hindi (Devanagari or Roman letters), English, Hinglish.

RULES
1. Extract ONLY what the transcript says. If a fact was not said, leave it out completely. Never guess, never infer, never fill gaps.
2. Return one item per fact: name, value, source_quote, confidence (0 to 1).
3. source_quote must be copied EXACTLY, word for word, from the transcript (same language and script), as short as possible.
4. victim_* fields describe the victim. beneficiary_* fields describe whoever RECEIVED the money (the fraudster).
5. Normalize values:
   - amount_inr: plain number of rupees. Examples: "48 hazaar" -> 48000, "2.5 lakh" -> 250000, "paanch hazaar" -> 5000. Number words in any language or script count.
   - incident_datetime: ISO 8601 with +05:30. Resolve words like "abhi", "20 minute pehle", "2 ghante pehle", "kal shaam" using the call start time given. If the time of day is vague, give your best time with lower confidence.
   - channel: one of upi, card, netbanking, wallet, other.
   - scam_type: one of digital_arrest, upi_refund, fake_job, phishing_link, otp_fraud, investment, other.
   - victim_account_hint: only the last 4 digits of the victim's own account.
   - transaction_id: only if the speaker calls it a transaction ID, UTR, RRN or reference number.
   - mobile numbers (complainant_mobile, beneficiary_phone): digits only.
   - evidence_available: items separated by "; ".
   - narrative: at most 3 plain sentences using only facts from the transcript. For its source_quote use one short phrase from the transcript.
6. Lower the confidence when the speaker is unsure or the text is noisy.
7. Facts from either speaker count."""


def call_model(transcript: str, call_start: datetime) -> Extraction:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model=os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"),
        contents=f"Call start time: {call_start.isoformat()}\n\nTRANSCRIPT:\n{transcript}",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=Extraction,
            temperature=0,
        ),
    )
    return Extraction.model_validate_json(response.text)


def _norm(text: str) -> str:
    """Lowercase, drop punctuation, collapse spaces - for comparing quotes."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s\u0900-\u0963\u0966-\u097f]", "", text.lower())).strip()


def _clean_value(name: str, raw: str):
    """Turn the model's text into the right Python value. Raises ValueError if unusable."""
    raw = raw.strip()
    if name == "amount_inr":
        return float(re.sub(r"[^\d.]", "", raw))
    if name == "incident_datetime":
        dt = datetime.fromisoformat(raw)
        return dt if dt.tzinfo else dt.replace(tzinfo=IST)
    if name == "victim_account_hint":
        digits = re.sub(r"\D", "", raw)
        if len(digits) < 4:
            raise ValueError("need at least 4 digits")
        return digits[-4:]
    if name == "evidence_available":
        parts = [p.strip() for p in raw.split(";") if p.strip()]
        if not parts:
            raise ValueError("empty list")
        return parts
    if name in ("complainant_mobile", "beneficiary_phone"):
        return re.sub(r"\D", "", raw)
    if name in ("channel", "scam_type"):
        return raw.lower()
    return raw


def build_ticket(extraction: Extraction, transcript: str) -> tuple[Ticket, list[str]]:
    """Safety checks between the model and the ticket.

    Returns (ticket, rejected). A fact is rejected when its quote is not really
    in the transcript or its value is unusable - it then stays null/missing.
    """
    haystack = _norm(transcript)
    best: dict[str, dict] = {}
    rejected: list[str] = []
    for item in extraction.items:
        name = item.name.value
        quote = _norm(item.source_quote)
        if not quote or quote not in haystack:
            rejected.append(f"{name}: quote not found in transcript -> {item.source_quote!r}")
            continue
        try:
            payload = {
                "value": _clean_value(name, item.value),
                "source_quote": item.source_quote.strip(),
                "confidence": min(1.0, max(0.0, item.confidence)),
            }
            Ticket(**{name: payload})  # validates this one field
        except ValueError:
            rejected.append(f"{name}: unusable value {item.value!r}")
            continue
        if name not in best or payload["confidence"] > best[name]["confidence"]:
            best[name] = payload
    return Ticket(**best), rejected


def extract(transcript: str, call_start: datetime) -> tuple[Ticket, list[str]]:
    """Transcript so far -> (ticket, rejected facts). Call again as new lines arrive."""
    return build_ticket(call_model(transcript, call_start), transcript)



