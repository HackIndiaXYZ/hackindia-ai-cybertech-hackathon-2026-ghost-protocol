from app.privacy import redact

samples = [
    "My mobile is 9876543210 and my Aadhaar is 1234 5678 9012.",
    "The UTR is 412345678901 and the account is 50100234567890.",
    "Call me on +91 98765 43210, my Aadhaar number is 123456789012.",
]
for s in samples:
    r = redact(s)
    print(r.text)
    print("  ->", r.counts)
