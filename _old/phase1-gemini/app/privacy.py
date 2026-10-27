import re
from dataclasses import dataclass, field

# 1234 5678 9012 or 1234-5678-9012 (Aadhaar style)
AADHAAR_SPACED = re.compile(r"(?<!\d)\d{4}[ -]\d{4}[ -]\d{4}(?!\d)")
# +91 98765 43210, +919876543210, 98765 43210
PHONE_FORMATTED = re.compile(
    r"(?<!\d)(?:\+91[ -]?[6-9]\d{4}[ -]?\d{5}|[6-9]\d{4}[ -]\d{5})(?!\d)"
)
# any plain run of 9-18 digits (bank accounts, phones, 12-digit IDs)
LONG_DIGITS = re.compile(r"(?<!\d)\d{9,18}(?!\d)")

# words that mean "this number is a transaction reference, keep it"
UTR_HINT = re.compile(r"(utr|rrn|txn|transaction|reference|\bref\b)", re.I)
AADHAAR_HINT = re.compile(r"(aadhaar|aadhar|uidai|\buid\b)", re.I)


@dataclass
class RedactionResult:
    text: str
    counts: dict = field(default_factory=dict)


def _bump(counts: dict, label: str) -> None:
    counts[label] = counts.get(label, 0) + 1


def _mask(digits_source: str, label: str) -> str:
    digits = re.sub(r"\D", "", digits_source)
    return f"[{label}-XXXX{digits[-4:]}]"


def redact(text: str) -> RedactionResult:
    counts: dict = {}

    def aadhaar_repl(m):
        _bump(counts, "AADHAAR")
        return _mask(m.group(0), "AADHAAR")

    def phone_repl(m):
        _bump(counts, "PHONE")
        return _mask(m.group(0), "PHONE")

    def long_repl(m):
        digits = m.group(0)
        # look only at the words between the previous number and this one
        before = m.string[max(0, m.start() - 40): m.start()]
        tail = re.split(r"\d", before)[-1]
        if UTR_HINT.search(tail):
            return digits  # likely a UTR, the critical field: keep it
        if len(digits) == 12 and AADHAAR_HINT.search(tail):
            label = "AADHAAR"
        elif len(digits) == 10 and digits[0] in "6789":
            label = "PHONE"
        elif len(digits) == 12:
            label = "ID12"
        else:
            label = "ACCOUNT"
        _bump(counts, label)
        return _mask(digits, label)

    out = AADHAAR_SPACED.sub(aadhaar_repl, text)
    out = PHONE_FORMATTED.sub(phone_repl, out)
    out = LONG_DIGITS.sub(long_repl, out)
    return RedactionResult(text=out, counts=counts)
