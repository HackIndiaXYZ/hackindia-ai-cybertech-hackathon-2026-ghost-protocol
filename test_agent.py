import asyncio
from app.privacy import redact
from app.agent import extract_ticket
from app.engine import check_missing, compute_triage

TRANSCRIPT = (
    "Operator: 1930 cyber helpline, tell me what happened.\n"
    "Caller: My name is Ramesh Kumar. Someone called saying I am under digital arrest "
    "and made me send 2 lakh rupees by UPI from my SBI account. My mobile is 9876543210 "
    "and my Aadhaar is 1234 5678 9012. It happened at 3 PM today. "
    "The money went to rahul.fraud@oksbi."
)

r = redact(TRANSCRIPT)
print("REDACTED:", r.counts)

ticket = asyncio.run(extract_ticket(r.text))

print("\nFILLED FIELDS:")
for name, f in ticket.model_dump().items():
    if f["value"]:
        print(f"  {name}: {f['value']!r} (conf {f['confidence']}) <- \"{f['source_quote']}\"")

print("\nMISSING:")
for m in check_missing(ticket):
    print(f"  [{m.severity.upper()}] {m.field}")

print("\nTRIAGE:", compute_triage(ticket, minutes_since_incident=45))
