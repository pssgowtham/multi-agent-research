from fastapi import FastAPI
from pydantic import BaseModel

from backend.agents.researcher import run_research

app = FastAPI(title="Multi-Agent Research API")

class ResearchRequest(BaseModel):
    query: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/research")
def research(request: ResearchRequest):
    result = run_research(request.query)
    return result