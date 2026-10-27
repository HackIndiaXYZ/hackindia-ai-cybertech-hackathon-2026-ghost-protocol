from fastapi import FastAPI

app = FastAPI(title="GoldenHour Desk")


@app.get("/health")
def health():
    return {"status": "ok", "note": "Concept prototype - synthetic data"}
