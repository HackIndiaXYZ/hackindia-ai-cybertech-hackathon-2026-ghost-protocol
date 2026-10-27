import pytest

from app.privacy import redact

UTR = "412398765432"
AADHAAR = "123456789012"  # same shape as a UTR: 12 digits


@pytest.mark.parametrize("text", [
    f"My transaction ID is {UTR}",
    f"UTR {UTR}",
    f"the UTR number is {UTR}",
    f"RRN: {UTR}",
    f"ref no {UTR}",
    f"txn id {UTR}",
    "हाँ, यूटीआर 308712345678 है",
    "ट्रांजैक्शन आईडी 308712345678 है",
])
def test_labelled_utr_is_kept(text):
    assert redact(text) == text


@pytest.mark.parametrize("text", [
    f"My Aadhaar is {AADHAAR}",
    "My Aadhaar is 1234 5678 9012",
    f"mera aadhaar number {AADHAAR} hai",
    f"UPI refund wala number {AADHAAR}",
])
def test_unlabelled_12_digits_is_redacted(text):
    out = redact(text)
    assert "[AADHAAR-LIKE REDACTED]" in out
    assert not any(c.isdigit() for c in out)


def test_collision_same_digits_opposite_fates():
    assert redact(f"UTR {AADHAAR}") == f"UTR {AADHAAR}"
    assert "[AADHAAR-LIKE REDACTED]" in redact(f"Aadhaar {AADHAAR}")


def test_both_in_one_sentence_utr_first():
    out = redact(f"UTR {UTR} and my Aadhaar {AADHAAR}")
    assert UTR in out
    assert AADHAAR not in out


def test_both_in_one_sentence_aadhaar_first():
    out = redact(f"My Aadhaar {AADHAAR} and the transaction ID {UTR}")
    assert UTR in out
    assert AADHAAR not in out


@pytest.mark.parametrize("text", ["card 4111 1111 1111 1111", "card 4111111111111111"])
def test_valid_card_is_masked_to_last_four(text):
    assert redact(text) == "card [CARD ****1111]"


def test_card_lookalike_failing_luhn_is_still_masked():
    out = redact("number 4111111111111112")
    assert "4111111111111112" not in out
    assert "****1112" in out


def test_pan_is_redacted():
    assert redact("My PAN is ABCDE1234F") == "My PAN is [PAN REDACTED]"


def test_account_number_keeps_last_four_only():
    out = redact("account number 50100098765432")
    assert "50100098765432" not in out
    assert "****5432" in out


@pytest.mark.parametrize("text", [
    "mobile 9000011111",
    "number +919000011111",
    "phone 98765 43210",
])
def test_phone_numbers_are_left_alone(text):
    assert redact(text) == text


def test_ten_digit_number_after_account_label_is_masked():
    out = redact("account 9876543210")
    assert "9876543210" not in out
    assert "****3210" in out


@pytest.mark.parametrize("text", [
    "48000 rupees gaye",
    "2.5 lakh rupees",
    "last chaar digit 4821",
    "27-10-2026 at 11:30",
    "2026-10-27T11:10:00+05:30",
])
def test_ordinary_numbers_are_untouched(text):
    assert redact(text) == text


def test_redaction_is_idempotent():
    text = (
        f"UTR {UTR}, Aadhaar {AADHAAR}, card 4111 1111 1111 1111, "
        "PAN ABCDE1234F, account 50100098765432"
    )
    once = redact(text)
    assert redact(once) == once
