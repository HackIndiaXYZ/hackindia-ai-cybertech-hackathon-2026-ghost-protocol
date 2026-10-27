from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app import main
from app.db import LineRow, SessionLocal
from app.schema import Ticket

client = TestClient(main.app)
AADHAAR = "123456789012"
START = {"call_start": "2026-10-27T11:30:00+05:30"}


def fake_ticket():
    return Ticket(amount_inr={"value": 48000.0, "source_quote": "48 hazaar", "confidence": 0.9})


def new_case():
    r = client.post("/cases", json=START)
    assert r.status_code == 200
    return r.json()["case_id"]


def post_line(cid, text="48 hazaar gaye"):
    return client.post(f"/cases/{cid}/lines", json={"speaker": "Victim", "text": text})


def test_new_case_is_empty_and_missing_everything():
    body = client.post("/cases", json=START).json()
    assert body["missing"][0] == "amount_inr"
    assert "beneficiary_identifier" in body["missing"]
    assert all(v is None for v in body["ticket"].values())


def test_model_sees_raw_text_but_database_stores_redacted(monkeypatch):
    seen = []

    def fake_extract(transcript, call_start):
        seen.append(transcript)
        return fake_ticket(), []

    monkeypatch.setattr(main, "extract", fake_extract)
    cid = new_case()
    body = post_line(cid, f"Aadhaar {AADHAAR}, 48 hazaar gaye").json()

    assert body["ticket"]["amount_inr"]["value"] == 48000
    assert "amount_inr" not in body["missing"]
    assert AADHAAR in seen[0]
    with SessionLocal() as db:
        stored = db.scalars(select(LineRow.text).where(LineRow.case_id == cid)).all()
    assert AADHAAR not in stored[0]
    assert "[AADHAAR-LIKE REDACTED]" in stored[0]


def test_extraction_failure_keeps_old_ticket_and_reports_error(monkeypatch):
    def boom(transcript, call_start):
        raise RuntimeError("503 overloaded")

    monkeypatch.setattr(main, "extract", boom)
    r = post_line(new_case())
    assert r.status_code == 200
    body = r.json()
    assert "503" in body["error"]
    assert all(v is None for v in body["ticket"].values())


def test_unknown_case_is_404():
    assert post_line("nope").status_code == 404
    assert client.delete("/cases/nope").status_code == 404


def test_delete_wipes_case_and_lines(monkeypatch):
    monkeypatch.setattr(main, "extract", lambda t, s: (fake_ticket(), []))
    cid = new_case()
    post_line(cid)
    assert client.delete(f"/cases/{cid}").status_code == 204
    with SessionLocal() as db:
        count = db.scalar(select(func.count()).select_from(LineRow).where(LineRow.case_id == cid))
    assert count == 0
    assert cid not in main.RAW
    assert post_line(cid).status_code == 404
