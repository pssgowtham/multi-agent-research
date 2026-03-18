from fastapi import FastAPI
from pydantic import BaseModel
from backend.graph.research_graph import run_research

app = FastAPI(title="Multi-Agent Research API")


class ResearchRequest(BaseModel):
    query: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/research")
def research(req: ResearchRequest):
    result = run_research(req.query)
    return result