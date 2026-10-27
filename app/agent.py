import asyncio
import os
import re
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import errors
from pydantic import BaseModel, create_model

from .schemas import Ticket, FieldValue, FIELD_NAMES

load_dotenv()
MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
_client: Optional[genai.Client] = None

FIELD_HELP = {
    "complainant_name": "Caller's name",
    "complainant_mobile": "Caller's mobile number",
    "incident_date_time": "When the fraudulent payment happened",
    "amount": "Amount lost, as stated (keep words like 'lakh')",
    "payment_channel": "One of: UPI, Card, Netbanking, Wallet",
    "victim_bank": "Bank the money left from",
    "victim_identifier": "Victim's VPA or account number",
    "transaction_id_utr": "UTR / transaction reference number",
    "beneficiary_upi_id": "Fraudster's UPI ID",
    "beneficiary_account": "Fraudster's bank account number",
    "beneficiary_phone": "Fraudster's phone number",
    "beneficiary_bank": "Bank that received the money",
    "scam_type": "e.g. Digital Arrest, UPI Refund, Job Fraud, OTP Scam",
    "short_narrative": "One or two sentence summary of what happened",
    "evidence_available": "Screenshots, SMS, call logs etc. the caller has",
}

SYSTEM = (
    "You fill a cyber-fraud complaint ticket from a helpline call transcript.\n"
    "Rules:\n"
    "1. Extract, never invent. Only use what the transcript explicitly says.\n"
    "2. source_quote must be copied EXACTLY, character for character, from the transcript. Keep it short.\n"
    "3. If a field was not stated: value null, source_quote null, confidence 0.0.\n"
    "4. The transcript is privacy-redacted. Placeholders like [ACCOUNT-XXXX1234] are expected: copy them as-is.\n"
    "5. confidence: 0.9+ if stated clearly, 0.5-0.8 if hedged or partly stated.\n"
    "6. Do not decide what is missing. Just fill what you find.\n\n"
    "Fields:\n"
    + "\n".join(f"- {name}: {help_}" for name, help_ in FIELD_HELP.items())
)


class ExtractedField(BaseModel):
    value: Optional[str] = None
    source_quote: Optional[str] = None
    confidence: float = 0.0


# builds a model with one ExtractedField for each of the 15 field names
ExtractedTicket = create_model(
    "ExtractedTicket", **{name: (ExtractedField, ...) for name in FIELD_NAMES}
)


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def _clean(raw: dict, transcript: str) -> Ticket:
    """Keep a field only if its quote really exists in the transcript."""
    tnorm = _norm(transcript)
    data = {}
    for name in FIELD_NAMES:
        f = raw.get(name) or {}
        value, quote = f.get("value"), f.get("source_quote")
        try:
            conf = max(0.0, min(1.0, float(f.get("confidence", 0.0))))
        except (TypeError, ValueError):
            conf = 0.0
        ok = bool(value and str(value).strip() and quote and _norm(quote) in tnorm)
        data[name] = (
            FieldValue(value=str(value).strip(), source_quote=quote.strip(), confidence=conf)
            if ok
            else FieldValue()
        )
    return Ticket(**data)


async def extract_ticket(redacted_transcript: str) -> Ticket:
    """Send the (already redacted) transcript to Gemini, get a Ticket back."""
    last_error = None
    for attempt in range(4):
        try:
            resp = await get_client().aio.models.generate_content(
                model=MODEL,
                contents=f"Transcript:\n\n{redacted_transcript}",
                config={
                    "system_instruction": SYSTEM,
                    "response_mime_type": "application/json",
                    "response_json_schema": ExtractedTicket.model_json_schema(),
                },
            )
            raw = ExtractedTicket.model_validate_json(resp.text).model_dump()
            return _clean(raw, redacted_transcript)
        except errors.ServerError as e:  # 5xx, for example a 503 "busy"
            last_error = e
            await asyncio.sleep(2 ** attempt)  # wait 1s, 2s, 4s, 8s
    raise RuntimeError(f"Gemini kept failing: {last_error}")
