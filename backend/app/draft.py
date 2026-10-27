"""Follow-up draft. Built from the ticket only, never the raw transcript."""
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

POLISH_PROMPT = """You polish a follow-up message from a cyber crime helpline to a fraud victim.
Keep every fact in the message. Add no new facts. Promise no refund, recovery or timeline.
Keep two parts: English first, then Hinglish. Plain text only, no markdown. Return only the message."""


def _val(ticket: dict, key: str):
    field = ticket.get(key)
    return field["value"] if field else None


def template(ticket: dict) -> str:
    name = _val(ticket, "complainant_name") or "Sir/Madam"
    amount = _val(ticket, "amount_inr")
    utr = _val(ticket, "transaction_id")
    en, hi = "", ""
    if amount is not None:
        en += f" Amount reported: Rs {amount:,.0f}."
        hi += f" Batayi gayi rakam: Rs {amount:,.0f}."
    if utr:
        en += f" Transaction ID (UTR): {utr}."
        hi += f" Transaction ID (UTR): {utr}."
    return (
        f"Namaste {name},\n\n"
        f"Thank you for calling the 1930 cyber crime helpline. Your complaint details have been recorded.{en}\n\n"
        "Please keep these safe and do not delete them:\n"
        "- Screenshots of the payment and the transaction receipt\n"
        "- The fraudster's chat, link, phone number or UPI ID\n"
        "- SMS and bank alerts about the debit\n"
        "- Call and message logs with the fraudster\n\n"
        "Do not share any OTP, PIN or password with anyone, and do not click any more links.\n\n"
        "---\n\n"
        f"Namaste {name} ji,\n\n"
        f"1930 cyber crime helpline par call karne ke liye dhanyavaad. Aapki shikayat ki details darj kar li gayi hain.{hi}\n\n"
        "Kripya ye sab surakshit rakhein, delete na karein:\n"
        "- Payment ke screenshot aur transaction receipt\n"
        "- Fraudster ki chat, link, phone number ya UPI ID\n"
        "- Paise katne ke SMS aur bank alerts\n"
        "- Fraudster ke saath call aur message log\n\n"
        "Kisi ko bhi OTP, PIN ya password na batayein, aur koi naya link na kholein."
    )


def make_draft(ticket: dict) -> tuple[str, str]:
    """Returns (text, source) where source is 'ai' or 'template'. Never raises."""
    base = template(ticket)
    if os.environ.get("DRAFT_USE_AI", "1") != "1":
        return base, "template"
    try:
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview"),
            contents=base,
            config=types.GenerateContentConfig(system_instruction=POLISH_PROMPT, temperature=0.2),
        )
        text = (response.text or "").strip()
        amount = _val(ticket, "amount_inr")
        utr = _val(ticket, "transaction_id")
        must_keep = ([f"{amount:,.0f}"] if amount is not None else []) + ([str(utr)] if utr else [])
        if not text or not all(m in text for m in must_keep):
            return base, "template"
        return text, "ai"
    except Exception:
        return base, "template"
