"""SQLite storage. Transcript lines are stored already redacted."""
import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import ForeignKey, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./goldenhour.db")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class CaseRow(Base):
    __tablename__ = "cases"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    call_start: Mapped[datetime]  # naive, in IST
    ticket_json: Mapped[str] = mapped_column(Text, default="{}")
    version: Mapped[int] = mapped_column(default=0)  # bumps on every change; the stream watches it
    draft_text: Mapped[str | None] = mapped_column(Text, default=None)
    draft_source: Mapped[str | None] = mapped_column(String, default=None)
    approved_at: Mapped[datetime | None] = mapped_column(default=None)
    lines: Mapped[list["LineRow"]] = relationship(
        cascade="all, delete-orphan", order_by="LineRow.id"
    )


class LineRow(Base):
    __tablename__ = "lines"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"))
    speaker: Mapped[str] = mapped_column(String)
    text: Mapped[str] = mapped_column(Text)  # already redacted

