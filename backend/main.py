from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from backend.graph.research_graph import run_research
from backend.core.guards import validate_input, validate_output

app = FastAPI(title="Multi-Agent Research API")


class ResearchRequest(BaseModel):
    query: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/research")
def research(req: ResearchRequest):
    # Input guard
    input_check = validate_input(req.query)
    if not input_check["ok"]:
        raise HTTPException(status_code=400, detail=input_check["reason"])

    # Run the pipeline
    result = run_research(req.query)

    # Output guard
    output_check = validate_output(
        output=result["final_answer"],
        source_material=result["search_results"]
    )
    if not output_check["ok"]:
        raise HTTPException(status_code=500, detail=output_check["reason"])

    return result