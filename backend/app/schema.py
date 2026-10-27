"""Ticket schema. Keep in sync with ../shared/ticket.ts"""
from datetime import datetime
from typing import Generic, Literal, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

Channel = Literal["upi", "card", "netbanking", "wallet", "other"]
ScamType = Literal[
    "digital_arrest", "upi_refund", "fake_job",
    "phishing_link", "otp_fraud", "investment", "other",
]


class Extracted(BaseModel, Generic[T]):
    value: T
    source_quote: str = Field(description="Exact words from the transcript")
    confidence: float = Field(ge=0, le=1)


class Ticket(BaseModel):
    complainant_name: Optional[Extracted[str]] = None
    complainant_mobile: Optional[Extracted[str]] = None
    incident_datetime: Optional[Extracted[datetime]] = None
    amount_inr: Optional[Extracted[float]] = None
    channel: Optional[Extracted[Channel]] = None
    victim_bank: Optional[Extracted[str]] = None
    victim_account_hint: Optional[Extracted[str]] = None  # last 4 digits only
    transaction_id: Optional[Extracted[str]] = None  # UTR / RRN
    beneficiary_upi_id: Optional[Extracted[str]] = None
    beneficiary_account: Optional[Extracted[str]] = None
    beneficiary_phone: Optional[Extracted[str]] = None
    beneficiary_bank: Optional[Extracted[str]] = None
    scam_type: Optional[Extracted[ScamType]] = None
    narrative: Optional[Extracted[str]] = None  # max 3 sentences, transcript only
    evidence_available: Optional[Extracted[list[str]]] = None


# Required for "ready to submit"
REQUIRED_FIELDS = [
    "amount_inr", "incident_datetime", "channel",
    "transaction_id", "victim_bank", "scam_type",
]
# ...plus at least ONE of these
BENEFICIARY_FIELDS = ["beneficiary_upi_id", "beneficiary_account", "beneficiary_phone"]
