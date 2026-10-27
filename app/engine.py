import re
from typing import Optional
from .schemas import Ticket, MissingField, Triage

MIN_CONFIDENCE = 0.5  # below this we treat the field as "not really known"

# (field, severity, question for the operator to ask)
RULES = [
    ("transaction_id_utr", "red", "Ask for the 12-digit UTR / transaction ID from the bank SMS or payment app."),
    ("amount", "red", "Ask how much money was lost."),
    ("incident_date_time", "red", "Ask exactly when the payment was made."),
    ("payment_channel", "red", "Ask how they paid: UPI, card, netbanking or wallet."),
    ("victim_bank", "red", "Ask which bank account the money left from."),
    ("complainant_name", "yellow", "Ask for the caller's full name."),
    ("complainant_mobile", "yellow", "Ask for a callback mobile number."),
    ("victim_identifier", "yellow", "Ask for the victim's UPI ID or account number."),
    ("beneficiary_bank", "yellow", "Ask which bank the money was sent to, if known."),
    ("scam_type", "yellow", "Ask how the fraudster contacted them and what they claimed."),
    ("short_narrative", "yellow", "Ask the caller to briefly describe what happened."),
]

# at least ONE of these must be present: where did the money go?
ANY_OF_RULES = [
    (
        ["beneficiary_upi_id", "beneficiary_account"],
        "red",
        "Ask where the money went: the receiver's UPI ID or account number.",
    ),
]


def _is_known(ticket: Ticket, name: str) -> bool:
    f = ticket.get(name)
    return (not f.is_empty) and f.confidence >= MIN_CONFIDENCE


def check_missing(ticket: Ticket) -> list[MissingField]:
    missing: list[MissingField] = []
    for name, severity, ask in RULES:
        if not _is_known(ticket, name):
            missing.append(MissingField(field=name, severity=severity, ask=ask))
    for names, severity, ask in ANY_OF_RULES:
        if not any(_is_known(ticket, n) for n in names):
            missing.append(MissingField(field="+".join(names), severity=severity, ask=ask))
    missing.sort(key=lambda m: 0 if m.severity == "red" else 1)  # red first
    return missing


def parse_amount(text: Optional[str]) -> float:
    if not text:
        return 0.0
    t = text.lower()
    nums = re.findall(r"\d[\d,]*\.?\d*", t)
    if not nums:
        return 0.0
    value = float(nums[0].replace(",", ""))
    if "crore" in t:
        value *= 10_000_000
    elif "lakh" in t or "lac" in t:
        value *= 100_000
    return value


def compute_triage(ticket: Ticket, minutes_since_incident: Optional[int] = None) -> Triage:
    score = 0
    reasons: list[str] = []

    amount = parse_amount(ticket.amount.value) if _is_known(ticket, "amount") else 0.0
    if amount >= 100_000:
        score += 3
        reasons.append("Amount is 1 lakh or more")
    elif amount >= 10_000:
        score += 2
        reasons.append("Amount is 10,000 or more")
    elif amount > 0:
        score += 1
        reasons.append("Money was lost")

    scam = (ticket.scam_type.value or "").lower()
    if "digital arrest" in scam:
        score += 1
        reasons.append("Digital Arrest scams often involve repeated large transfers")

    if minutes_since_incident is not None:
        if minutes_since_incident <= 60:
            score += 3
            reasons.append("Inside the Golden Hour (60 minutes)")
        elif minutes_since_incident <= 180:
            score += 1
            reasons.append("Within 3 hours of the incident")

    has_utr = _is_known(ticket, "transaction_id_utr")
    has_dest = _is_known(ticket, "beneficiary_upi_id") or _is_known(ticket, "beneficiary_account")
    freeze_ready = has_utr and has_dest

    if score >= 5:
        level = "CRITICAL"
    elif score >= 3:
        level = "HIGH"
    else:
        level = "MEDIUM"
    return Triage(level=level, score=score, reasons=reasons, freeze_ready=freeze_ready)
