"""Deterministic missing-field detection. No model call here."""
from app.schema import BENEFICIARY_FIELDS, REQUIRED_FIELDS, Ticket


def missing_fields(ticket: Ticket) -> list[str]:
    """Required fields still empty, in the order we should ask about them.

    'beneficiary_identifier' means none of UPI ID / account / phone is known.
    """
    missing = [f for f in REQUIRED_FIELDS if getattr(ticket, f) is None]
    if all(getattr(ticket, f) is None for f in BENEFICIARY_FIELDS):
        missing.append("beneficiary_identifier")
    return missing


def is_ready(ticket: Ticket) -> bool:
    return not missing_fields(ticket)
