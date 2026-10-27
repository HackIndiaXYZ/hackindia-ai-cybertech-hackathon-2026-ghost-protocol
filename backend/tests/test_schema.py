import pytest
from pydantic import ValidationError

from app.schema import BENEFICIARY_FIELDS, REQUIRED_FIELDS, Extracted, Ticket


def test_empty_ticket_is_all_null():
    assert all(v is None for v in Ticket().model_dump().values())


def test_roundtrip_keeps_quote_and_value():
    t = Ticket(amount_inr=Extracted[float](value=48000, source_quote="48 hazaar", confidence=0.9))
    back = Ticket.model_validate_json(t.model_dump_json())
    assert back.amount_inr.value == 48000
    assert back.amount_inr.source_quote == "48 hazaar"


def test_confidence_out_of_range_rejected():
    with pytest.raises(ValidationError):
        Extracted[float](value=1, source_quote="x", confidence=1.5)


def test_required_names_exist_on_ticket():
    for name in REQUIRED_FIELDS + BENEFICIARY_FIELDS:
        assert name in Ticket.model_fields
