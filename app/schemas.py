from typing import Optional, Literal
from pydantic import BaseModel, Field


class FieldValue(BaseModel):
    value: Optional[str] = None
    source_quote: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)

    @property
    def is_empty(self) -> bool:
        return self.value is None or str(self.value).strip() == ""


FIELD_NAMES = [
    "complainant_name",
    "complainant_mobile",
    "incident_date_time",
    "amount",
    "payment_channel",
    "victim_bank",
    "victim_identifier",
    "transaction_id_utr",
    "beneficiary_upi_id",
    "beneficiary_account",
    "beneficiary_phone",
    "beneficiary_bank",
    "scam_type",
    "short_narrative",
    "evidence_available",
]


class Ticket(BaseModel):
    complainant_name: FieldValue = Field(default_factory=FieldValue)
    complainant_mobile: FieldValue = Field(default_factory=FieldValue)
    incident_date_time: FieldValue = Field(default_factory=FieldValue)
    amount: FieldValue = Field(default_factory=FieldValue)
    payment_channel: FieldValue = Field(default_factory=FieldValue)
    victim_bank: FieldValue = Field(default_factory=FieldValue)
    victim_identifier: FieldValue = Field(default_factory=FieldValue)
    transaction_id_utr: FieldValue = Field(default_factory=FieldValue)
    beneficiary_upi_id: FieldValue = Field(default_factory=FieldValue)
    beneficiary_account: FieldValue = Field(default_factory=FieldValue)
    beneficiary_phone: FieldValue = Field(default_factory=FieldValue)
    beneficiary_bank: FieldValue = Field(default_factory=FieldValue)
    scam_type: FieldValue = Field(default_factory=FieldValue)
    short_narrative: FieldValue = Field(default_factory=FieldValue)
    evidence_available: FieldValue = Field(default_factory=FieldValue)

    def get(self, name: str) -> FieldValue:
        return getattr(self, name)


class MissingField(BaseModel):
    field: str
    severity: Literal["red", "yellow"]
    ask: str  # what the operator should ask the caller


class Triage(BaseModel):
    level: Literal["CRITICAL", "HIGH", "MEDIUM"]
    score: int
    reasons: list[str]
    freeze_ready: bool  # True when we have enough to request a freeze


class TicketUpdate(BaseModel):
    ticket: Ticket
    missing: list[MissingField]
    triage: Triage
