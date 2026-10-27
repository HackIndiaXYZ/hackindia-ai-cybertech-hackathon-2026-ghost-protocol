r"""Run extraction on one synthetic call file.

Usage (from backend/):  python -m app.cli ..\data\calls\01_olx_upi_hinglish.txt
First line of the file must be:  # call_start: 2026-10-27T11:30:00+05:30
"""
import sys
from datetime import datetime
from pathlib import Path

from app.extractor import extract
from app.missing import missing_fields
from app.schema import Ticket


def load_call(path: str) -> tuple[datetime, str]:
    text = Path(path).read_text(encoding="utf-8-sig")
    first, _, transcript = text.partition("\n")
    if not first.startswith("# call_start:"):
        raise SystemExit("First line must look like: # call_start: 2026-10-27T11:30:00+05:30")
    start = datetime.fromisoformat(first.split(":", 1)[1].strip())
    return start, transcript.strip()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m app.cli <call-file>")
    start, transcript = load_call(sys.argv[1])
    ticket, rejected = extract(transcript, start)

    print(f"Call start: {start.isoformat()}\n")
    for name in Ticket.model_fields:
        field = getattr(ticket, name)
        if field is None:
            print(f"  {name:<22} -")
        else:
            print(f'  {name:<22} {field.value}  [{field.confidence:.2f}]  "{field.source_quote}"')

    gaps = missing_fields(ticket)
    print("\nMISSING:", ", ".join(gaps) if gaps else "none - ready to submit")
    if rejected:
        print("\nREJECTED by safety checks:")
        for r in rejected:
            print("  ", r)


if __name__ == "__main__":
    main()



