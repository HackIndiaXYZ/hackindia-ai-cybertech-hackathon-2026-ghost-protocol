from app.missing import is_ready, missing_fields
from app.schema import Ticket


def f(value):
    return {"value": value, "source_quote": "x", "confidence": 0.9}


FULL = dict(
    amount_inr=f(48000.0),
    incident_datetime=f("2026-10-27T11:10:00+05:30"),
    channel=f("upi"),
    transaction_id=f("412398765432"),
    victim_bank=f("SBI"),
    scam_type=f("upi_refund"),
    beneficiary_upi_id=f("buyer@okaxis"),
)


def test_empty_ticket_is_missing_everything():
    assert missing_fields(Ticket()) == [
        "amount_inr", "incident_datetime", "channel", "transaction_id",
        "victim_bank", "scam_type", "beneficiary_identifier",
    ]


def test_full_ticket_is_ready():
    t = Ticket(**FULL)
    assert missing_fields(t) == []
    assert is_ready(t)


def test_any_one_beneficiary_identifier_is_enough():
    for key in ("beneficiary_upi_id", "beneficiary_account", "beneficiary_phone"):
        data = {k: v for k, v in FULL.items() if k != "beneficiary_upi_id"}
        data[key] = f("9000011111")
        assert missing_fields(Ticket(**data)) == []


def test_beneficiary_bank_alone_is_not_enough():
    data = {k: v for k, v in FULL.items() if k != "beneficiary_upi_id"}
    data["beneficiary_bank"] = f("HDFC Bank")
    assert missing_fields(Ticket(**data)) == ["beneficiary_identifier"]


def test_missing_utr_is_flagged():
    data = {k: v for k, v in FULL.items() if k != "transaction_id"}
    assert missing_fields(Ticket(**data)) == ["transaction_id"]
