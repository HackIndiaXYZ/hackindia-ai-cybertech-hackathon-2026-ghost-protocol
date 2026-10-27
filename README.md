# GoldenHour Desk

> **AI Co-Pilot for 1930 Cyber Fraud Helpline Operators**  
> *Developed for HackIndia AI CyberTech Hackathon 2026 by Team **Ghost Protocol**.*

---

## ⚡ Problem: The 60-Minute "Golden Hour"

When a citizen in India falls victim to cyber fraud, the first 60 minutes (**the Golden Hour**) are critical. During this window, money is still sitting in the first or second-hop mule accounts. If bank freeze requests (through the Citizen Financial Cyber Fraud Reporting and Management System / 1930 helpline) are initiated immediately, recovery rates can exceed 70%.

However, 1930 operators face extreme challenges:
* **Caller Panic & Fast Speech:** Callers speak in a mix of Hindi, English, and Hinglish while stressed.
* **Manual Data Entry Bottleneck:** Extracting 12-digit UTR numbers, beneficiary VPAs, bank names, and incident timelines takes 15–30 minutes per ticket.
* **Missing Key Fields:** Crucial money-trail identifiers (UTR, fraudster UPI ID) are often missed during the rush.

---

## 🛡️ Solution: GoldenHour Desk

**GoldenHour Desk** is an assistive AI co-pilot designed for 1930 helpline operators. It operates with a **human-in-the-loop** philosophy: **the operator approves everything**.

```
    Caller (Voice / Audio Stream)
                │
                ▼
     Live Transcript Stream (Hindi / English / Hinglish)
                │
         ┌──────┴─────────────────────────────────┐
         ▼                                        ▼
 [In-Memory Privacy Redactor]              [LLM Extractor]
 (Aadhaar / Card numbers masked)          (Gemini 3.8 Flash)
         │                                        │
         ▼                                        ▼
   [Encrypted DB]                       [Verbatim Quote Verifier]
   (Redacted logs)                      (Rejects hallucinations)
                                                  │
                                                  ▼
                                      [Deterministic Guidance Engine]
                                      • Missing Field Ranker (Money Trail first)
                                      • Golden Hour Countdown & Triage
                                      • Pre-submission Completeness Check
                                                  │
                                                  ▼
                                      [Operator Review & Approval]
                                      • Live Ticket View
                                      • Bilingual Follow-up Generator (SMS/WA)
```

---

## ✨ Key Capabilities

1. **Zero-Hallucination Grounding:** Every extracted ticket field requires an exact, character-level quote from the transcript. If the model imagines a field that was not explicitly spoken, the verification layer drops it.
2. **DPDP Act & Privacy by Design:** Raw transcripts containing Aadhaar numbers or full card numbers are redacted in memory before any row is written to the database.
3. **Deterministic Urgency Triage & Clock:** Automatically calculates elapsed time from the incident, displaying an urgent countdown for cases within the 60-minute window.
4. **Smart Operator Prompts:** Dynamically computes which critical detail is missing next (prioritizing the beneficiary money trail: UPI ID -> UTR -> Bank -> Name) and provides bilingual question prompts.
5. **Bilingual Complainant Advisory:** Once the ticket is ready to submit, it generates a polished English and Hinglish follow-up message instructing the victim on what evidence to preserve (screenshots, SMS alerts, links).
6. **Zero-Quota Replay Mode:** Includes an offline replay mode (`sample_recording.json`) so judges and evaluators can experience the full interactive workflow without needing API keys or burning rate limits.

---

## 📂 Repository Structure

```text
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application & SSE streaming
│   │   ├── extractor.py     # Gemini extraction + quote verification
│   │   ├── guidance.py      # Deterministic triage & next-question engine
│   │   ├── missing.py       # Ticket completeness validation
│   │   ├── privacy.py       # PII & Aadhaar redaction
│   │   ├── draft.py         # Bilingual follow-up message generator
│   │   ├── db.py            # SQLite database schema
│   │   └── schema.py        # Pydantic Ticket schemas
│   ├── tests/               # 50+ unit tests (schema, privacy, API, guidance)
│   ├── sample_recording.json # Pre-recorded 14-turn synthetic demo
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js 16 App Router
│   │   ├── components/      # TranscriptPanel, TicketPanel, GuidanceBar, FollowUpCard
│   │   └── lib/             # API client, types, and sample call data
│   └── package.json
├── shared/
│   └── ticket.ts            # Shared TypeScript ticket definitions
├── data/
│   └── calls/               # Synthetic sample transcripts (Hindi, English, Hinglish)
└── README.md
```

---

## 🚀 Quickstart for Judges

You can run GoldenHour Desk in **two modes**:
* **Mode A: Instant Replay Mode (Recommended)** — No API key needed. Zero quota usage. 100% deterministic.
* **Mode B: Live AI Mode** — Uses Google Gemini to extract fields from live input in real-time.

### 1. Prerequisites
* Python 3.11+ 
* Node.js 18+ and npm

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
# Windows:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
# python3 -m venv .venv
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional - only needed for Live Mode B)
# Copy .env.example to .env and configure your GEMINI_API_KEY
# cp .env.example .env

# Start FastAPI server (Port 8000)
python -m uvicorn app.main:app --port 8000
```
*Backend will be running at `http://localhost:8000` (Healthcheck: `http://localhost:8000/health`).*

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install packages
npm install

# Start Next.js dev server (Port 3000)
npm run dev
```
*Frontend will be running at `http://localhost:3000`.*

---

## 🎬 How to Experience the Demo

1. Open **`http://localhost:3000`** in your browser.
2. Click **"Replay sample"**:
   * Watch the synthetic call stream turn-by-turn between an Operator and a fraud victim (OLX UPI advance scam).
   * Notice how the **Guidance Bar** prompts the operator to ask for the UTR.
   * Notice the **Golden Hour badge** and **Triage level** update based on the incident time.
   * At turn 13, when the UTR (`508812345678`) is provided, the ticket switches to **Ready to submit** in green.
   * Click **"Draft follow-up"** to view and edit the generated bilingual advisory for the complainant.
3. Click **"Play sample call"** (if a Gemini API key is configured in `backend/.env`) to test live LLM extraction.

---

## 🧪 Running Automated Tests

Run the test suite across unit tests for privacy redaction, quote verification, and schema validation:

```bash
cd backend
pytest tests/test_extractor.py tests/test_schema.py tests/test_missing.py tests/test_privacy.py
```

---

## ⚖️ Ethics, Privacy & Compliance

* **Synthetic Data Only:** All sample calls, names, phone numbers, and account numbers in this repository are completely synthetic and for demonstration purposes.
* **Human-in-the-Loop:** GoldenHour Desk does not automatically submit complaints or freeze accounts. It structures incoming intelligence so human officers can make high-speed, informed decisions.
* **Indian DPDP Act Compliance:** Protects citizen privacy by redacting high-risk personal identifiers (like Aadhaar) prior to database persistence.

---

## 👥 Team: Ghost Protocol
* **Hackathon:** HackIndia AI CyberTech Hackathon 2026
* **Repository:** `hackindia-ai-cybertech-hackathon-2026-ghost-protocol`
