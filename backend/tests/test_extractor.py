from datetime import timedelta

from app.extractor import ExtractedItem, Extraction, FieldName, build_ticket

TRANSCRIPT = (
    "Victim: Sir 48 hazaar kat gaye, SBI se. "
    "Account ke last chaar digit 4821 hain. Ye abhi 20 minute pehle hua."
)


def item(name, value, quote, conf=0.9):
    return ExtractedItem(name=FieldName(name), value=value, source_quote=quote, confidence=conf)


def run(*items):
    return build_ticket(Extraction(items=list(items)), TRANSCRIPT)


def test_valid_fact_is_kept_with_its_quote():
    t, rejected = run(item("amount_inr", "48000", "48 hazaar"))
    assert t.amount_inr.value == 48000
    assert t.amount_inr.source_quote == "48 hazaar"
    assert rejected == []


def test_invented_quote_is_dropped():
    t, rejected = run(item("victim_bank", "HDFC", "HDFC Bank se"))
    assert t.victim_bank is None
    assert len(rejected) == 1


def test_account_hint_keeps_last_four_digits_only():
    t, _ = run(item("victim_account_hint", "123456784821", "last chaar digit 4821"))
    assert t.victim_account_hint.value == "4821"


def test_unknown_channel_is_dropped():
    t, rejected = run(item("channel", "crypto", "SBI se"))
    assert t.channel is None
    assert len(rejected) == 1


def test_datetime_without_timezone_gets_ist():
    t, _ = run(item("incident_datetime", "2026-10-27T11:10:00", "20 minute pehle"))
    assert t.incident_datetime.value.utcoffset() == timedelta(hours=5, minutes=30)


def test_duplicate_fact_keeps_higher_confidence():
    t, _ = run(
        item("amount_inr", "40000", "48 hazaar", conf=0.5),
        item("amount_inr", "48000", "48 hazaar", conf=0.9),
    )
    assert t.amount_inr.value == 48000
