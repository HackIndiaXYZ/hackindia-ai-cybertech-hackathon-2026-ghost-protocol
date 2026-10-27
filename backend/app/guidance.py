"""Deterministic guidance: next question, triage, golden-hour clock. No model call."""
from datetime import datetime, timedelta

from app.extractor import IST

GOLDEN_HOUR_MIN = 60

# Ask the money trail first: it is the most time-critical.
ASK_ORDER = [
    "beneficiary_identifier",
    "transaction_id",
    "incident_datetime",
    "amount_inr",
    "channel",
    "victim_bank",
    "complainant_name",
]

PROMPTS = {
    "beneficiary_identifier": (
        "Ask for the fraudster's UPI ID, account number or phone number.",
        "Jisko paise gaye, uski UPI ID, account number ya phone number bataiye.",
    ),
    "transaction_id": (
        "Ask for the 12-digit UTR from the payment app's transaction details.",
        "Payment app kholiye, transaction details mein 12 digit ka UTR number bataiye.",
    ),
    "incident_datetime": (
        "Ask when it happened.",
        "Yeh kab hua? Kitni der pehle?",
    ),
    "amount_inr": (
        "Ask how much money was lost.",
        "Kitne rupaye kate?",
    ),
    "channel": (
        "Ask how the payment was made (UPI, card, net banking).",
        "Payment kaise gaya - UPI, card ya net banking?",
    ),
    "victim_bank": (
        "Ask which bank the money left from.",
        "Aapka paisa kis bank se gaya?",
    ),
    "complainant_name": (
        "Ask for the caller's full name.",
        "Aapka poora naam bataiye.",
    ),
}


def _val(ticket: dict, key: str):
    field = ticket.get(key)
    return field["value"] if field else None


def _parse(value) -> datetime | None:
    if not value:
        return None
    try:
        d = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=IST)
    return d.astimezone(IST)


def next_question(missing: list[str]) -> dict | None:
    if not missing:
        return None
    rank = lambda k: ASK_ORDER.index(k) if k in ASK_ORDER else len(ASK_ORDER)
    key = sorted(missing, key=rank)[0]
    english, hinglish = PROMPTS.get(key, (f"Ask for: {key}.", f"{key} bataiye."))
    return {"field": key, "english": english, "hinglish": hinglish}


def triage(ticket: dict, call_start: datetime) -> dict:
    incident = _parse(_val(ticket, "incident_datetime"))
    amount = _val(ticket, "amount_inr")
    if incident is None or amount is None:
        return {"level": "pending", "reason": "Needs incident time and amount."}
    elapsed = max(0.0, (call_start.replace(tzinfo=IST) - incident).total_seconds() / 60)
    if elapsed <= GOLDEN_HOUR_MIN and amount >= 10000:
        return {"level": "critical", "reason": f"{int(elapsed)} min after the incident, Rs {amount:,.0f} lost. Request a freeze now."}
    if elapsed <= 24 * 60 or amount >= 50000:
        return {"level": "high", "reason": "Within 24 hours or a large amount."}
    return {"level": "standard", "reason": "Golden hour has passed and the amount is moderate."}


def clock(ticket: dict, current_time: datetime | None = None) -> dict | None:
    incident = _parse(_val(ticket, "incident_datetime"))
    if incident is None:
        return None
    deadline = incident + timedelta(minutes=GOLDEN_HOUR_MIN)
    now_dt = current_time.astimezone(IST) if current_time else datetime.now(IST)
    days_elapsed = max(0.0, (now_dt - incident).total_seconds() / 86400.0)

    if days_elapsed <= 3.0:
        rbi_status = "zero_liability"
        rbi_text = "Within 3-Day Window: Zero Customer Liability"
    elif days_elapsed <= 7.0:
        rbi_status = "limited_liability"
        rbi_text = "Within 4–7 Day Window: Limited Customer Liability"
    else:
        rbi_status = "beyond_7_days"
        rbi_text = "Beyond 7 Days: Bank Discretion Applies"

    return {
        "incident_at": incident.isoformat(),
        "deadline_at": deadline.isoformat(),
        "rbi_window": {
            "days_elapsed": round(days_elapsed, 1),
            "tier": rbi_status,
            "text": rbi_text,
            "caution": "RBI rules apply to unauthorised transactions. For victim-authorised payments under fraud, immediate 1930 bank lien is the primary recovery route.",
        },
    }


def guidance(ticket: dict, missing: list[str], call_start: datetime) -> dict:
    return {
        "next_question": next_question(missing),
        "triage": triage(ticket, call_start),
        "clock": clock(ticket, call_start),
    }
