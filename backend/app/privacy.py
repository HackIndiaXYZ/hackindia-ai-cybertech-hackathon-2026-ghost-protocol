"""Redaction for anything we log or store. Pure Python, no model call.

Masks: Aadhaar-like 12-digit numbers, PAN, Luhn-valid card numbers and other
long account-like numbers (last 4 kept). A 12-digit number is NOT masked when
a transaction label (UTR, RRN, ref, transaction ID...) sits right before it.
Indian mobile numbers are left alone.
"""
import re

# 12 or 16 digits written in groups of 4, or any plain run of 9-19 digits
NUMBER = re.compile(r"(?<!\d)(?:\d{4}(?:[ -]\d{4}){2,3}|\d{9,19})(?!\d)")
PAN = re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.I)

# Words that mean "this number is a transaction reference". 'ref' must be a whole
# word so that 'refund' does not count.
TXN_LABEL = re.compile(
    r"\b(?:utr|rrn|txn|ref(?:erence)?|transaction)\b|ट्रांजैक्शन|यूटीआर",
    re.I,
)
ACCOUNT_LABEL = re.compile(r"\b(?:account|a/c|acct|khata)\b|खाता", re.I)

LABEL_WINDOW = 35  # how many characters before a number we read for a label


def _luhn_ok(digits: str) -> bool:
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


def redact(text: str) -> str:
    text = PAN.sub("[PAN REDACTED]", text)

    def replace(m: re.Match) -> str:
        raw = m.group(0)
        digits = re.sub(r"\D", "", raw)
        n = len(digits)

        # Only the words between the previous number and this one count as context.
        window = m.string[max(0, m.start() - LABEL_WINDOW): m.start()]
        before = re.split(r"\d", window)[-1]

        if TXN_LABEL.search(before):
            return raw  # UTR / RRN / reference number: protect it
        if 13 <= n <= 19 and _luhn_ok(digits):
            return f"[CARD ****{digits[-4:]}]"
        if n == 12:
            if m.start() > 0 and m.string[m.start() - 1] == "+" and digits.startswith("91"):
                return raw  # +91 mobile number
            return "[AADHAAR-LIKE REDACTED]"
        if n == 10 and digits[0] in "6789" and not ACCOUNT_LABEL.search(before):
            return raw  # Indian mobile number
        return f"[ACCOUNT ****{digits[-4:]}]"

    return NUMBER.sub(replace, text)
