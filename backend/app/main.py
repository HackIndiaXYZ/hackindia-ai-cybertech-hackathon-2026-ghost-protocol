"""GoldenHour Desk API. Concept prototype - synthetic data."""
import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.db import Base, CaseRow, LineRow, SessionLocal, engine
from app.extractor import IST, extract
from app.draft import make_draft
from app.guidance import guidance
from app.missing import is_ready, missing_fields
from app.privacy import redact
from app.schema import Ticket

Base.metadata.create_all(engine)

app = FastAPI(title="GoldenHour Desk")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Raw transcript lines live in memory only (the model needs them whole).
# The database only ever gets the redacted version.
RAW: dict[str, list[str]] = {}


class NewCase(BaseModel):
    call_start: datetime | None = None


class NewLine(BaseModel):
    speaker: Literal["Victim", "Operator"]
    text: str


def snapshot(row: CaseRow) -> dict:
    ticket = Ticket.model_validate_json(row.ticket_json)
    return {
        "case_id": row.id,
        "version": row.version,
        "ticket": ticket.model_dump(mode="json"),
        "missing": missing_fields(ticket),
        "ready": is_ready(ticket), "draft": {"text": row.draft_text, "source": row.draft_source, "approved_at": row.approved_at.isoformat() if row.approved_at else None}, **guidance(ticket.model_dump(mode="json"), missing_fields(ticket), row.call_start),
    }


@app.get("/health")
def health():
    return {"status": "ok", "note": "Concept prototype - synthetic data"}


@app.post("/cases")
def create_case(body: NewCase | None = None):
    start = body.call_start if body and body.call_start else datetime.now(IST)
    if start.tzinfo is None:
        start = start.replace(tzinfo=IST)
    start = start.astimezone(IST).replace(tzinfo=None)
    with SessionLocal() as db:
        row = CaseRow(id=uuid.uuid4().hex[:10], call_start=start, ticket_json="{}", version=0)
        db.add(row)
        db.commit()
        return snapshot(row)


@app.post("/cases/{case_id}/lines")
def add_line(case_id: str, body: NewLine):
    with SessionLocal() as db:
        row = db.get(CaseRow, case_id)
        if row is None:
            raise HTTPException(404, "case not found")
        if case_id not in RAW:  # e.g. after a server restart: fall back to redacted lines
            RAW[case_id] = [f"{ln.speaker}: {ln.text}" for ln in row.lines]
        RAW[case_id].append(f"{body.speaker}: {body.text}")
        db.add(LineRow(case_id=case_id, speaker=body.speaker, text=redact(body.text)))

        error, rejected = None, []
        try:
            ticket, rejected = (Ticket.model_validate_json(row.ticket_json), []) if body.speaker == "Operator" else extract("\n".join(RAW[case_id]), row.call_start.replace(tzinfo=IST))
            row.ticket_json = ticket.model_dump_json()
        except Exception as exc:  # e.g. Gemini 503: keep the old ticket, tell the UI
            error = f"{type(exc).__name__}: {str(exc)[:150]}"
        row.version += 1
        db.commit()
        return {**snapshot(row), "error": error, "rejected": rejected}


@app.get("/cases/{case_id}/stream")
async def stream(case_id: str, request: Request):
    with SessionLocal() as db:
        if db.get(CaseRow, case_id) is None:
            raise HTTPException(404, "case not found")

    async def events():
        last, ticks = -1, 0
        while not await request.is_disconnected():
            with SessionLocal() as db:
                row = db.get(CaseRow, case_id)
                if row is None:
                    yield "event: deleted\ndata: {}\n\n"
                    return
                if row.version != last:
                    last, ticks = row.version, 0
                    yield f"event: state\ndata: {json.dumps(snapshot(row))}\n\n"
            ticks += 1
            if ticks % 30 == 0:
                yield ": keepalive\n\n"
            await asyncio.sleep(0.5)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.delete("/cases/{case_id}", status_code=204)
def delete_case(case_id: str):
    with SessionLocal() as db:
        row = db.get(CaseRow, case_id)
        if row is None:
            raise HTTPException(404, "case not found")
        db.delete(row)  # lines go with it
        db.commit()
    RAW.pop(case_id, None)





class DraftBody(BaseModel):
    text: str


@app.post("/cases/{case_id}/draft")
def create_draft(case_id: str):
    with SessionLocal() as db:
        row = db.get(CaseRow, case_id)
        if row is None:
            raise HTTPException(404, "case not found")
        if row.approved_at is not None:
            raise HTTPException(409, "already approved")
        ticket = Ticket.model_validate_json(row.ticket_json).model_dump(mode="json")
        row.draft_text, row.draft_source = make_draft(ticket)
        row.version += 1
        db.commit()
        return snapshot(row)


@app.post("/cases/{case_id}/approve")
def approve_draft(case_id: str, body: DraftBody):
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "empty message")
    with SessionLocal() as db:
        row = db.get(CaseRow, case_id)
        if row is None:
            raise HTTPException(404, "case not found")
        row.draft_text = text  # the operator's edited version is what gets approved
        row.approved_at = datetime.now(IST).replace(tzinfo=None)
        row.version += 1
        db.commit()
        return snapshot(row)
