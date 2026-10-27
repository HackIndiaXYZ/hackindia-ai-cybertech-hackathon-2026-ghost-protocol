from app.schemas import Ticket, FieldValue
from app.engine import check_missing, compute_triage

t = Ticket()
t.amount = FieldValue(value="2 lakh", source_quote="send 2 lakh rupees", confidence=0.95)
t.payment_channel = FieldValue(value="UPI", source_quote="by UPI", confidence=0.9)
t.beneficiary_upi_id = FieldValue(value="rahul.fraud@oksbi", source_quote="rahul.fraud@oksbi", confidence=0.95)
t.scam_type = FieldValue(value="Digital Arrest", source_quote="under digital arrest", confidence=0.9)

print("MISSING:")
for m in check_missing(t):
    print(f"  [{m.severity.upper()}] {m.field}")

print()
print("TRIAGE, 45 min after incident:", compute_triage(t, 45))
print("TRIAGE, time not known:      ", compute_triage(t))
