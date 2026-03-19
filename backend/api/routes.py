from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.graph.research_graph import run_research
from backend.core.guards import validate_input, validate_output
import json
import asyncio

router = APIRouter()


class ResearchRequest(BaseModel):
    query: str


async def research_stream(query: str):
    """Async generator that streams agent progress via SSE."""
    try:
        # Stream agent status updates
        agents = ["planner", "search", "analyst", "writer", "critic"]
        
        def on_agent_start(agent: str):
            return f"data: {json.dumps({'type': 'agent_start', 'agent': agent})}\n\n"
        
        def on_agent_end(agent: str):
            return f"data: {json.dumps({'type': 'agent_end', 'agent': agent})}\n\n"

        # Run graph with streaming callbacks
        import time
        start_times = {}

        loop = asyncio.get_event_loop()
        
        # Send start event
        yield f"data: {json.dumps({'type': 'start', 'message': 'Research started'})}\n\n"

        # Run each agent and stream progress
        from backend.agents.planner import planner_node
        from backend.agents.search import search_node
        from backend.agents.analyst import analyst_node
        from backend.agents.writer import writer_node
        from backend.agents.critic import critic_node
        from backend.graph.state import ResearchState

        state: ResearchState = {
            "query": query,
            "search_queries": [],
            "planner_output": "",
            "search_results": "",
            "analyst_output": "",
            "writer_output": "",
            "critic_feedback": "",
            "critic_approved": False,
            "final_answer": "",
            "iterations": 0,
            "error": ""
        }

        timeline = {}

        for agent_name, agent_fn in [
            ("planner", planner_node),
            ("search", search_node),
            ("analyst", analyst_node),
            ("writer", writer_node),
            ("critic", critic_node),
        ]:
            yield f"data: {json.dumps({'type': 'agent_start', 'agent': agent_name})}\n\n"
            t0 = time.time()
            state = await loop.run_in_executor(None, agent_fn, state)
            duration = round(time.time() - t0, 2)
            timeline[agent_name] = duration
            yield f"data: {json.dumps({'type': 'agent_end', 'agent': agent_name, 'duration': duration})}\n\n"

            if state.get("error"):
                yield f"data: {json.dumps({'type': 'error', 'message': state['error']})}\n\n"
                return

        # Send final result
        yield f"data: {json.dumps({'type': 'result', 'data': {**state, 'timeline': timeline}})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/research")
async def research(req: ResearchRequest):
    """Standard JSON endpoint — used for history retrieval."""
    input_check = validate_input(req.query)
    if not input_check["ok"]:
        raise HTTPException(status_code=400, detail=input_check["reason"])

    result = await asyncio.get_event_loop().run_in_executor(
        None, __import__('backend.graph.research_graph', fromlist=['run_research']).run_research, req.query
    )

    output_check = validate_output(
        output=result["final_answer"],
        source_material=result["search_results"]
    )
    if not output_check["ok"]:
        raise HTTPException(status_code=500, detail=output_check["reason"])

    return result


@router.post("/research/stream")
async def research_stream_endpoint(req: ResearchRequest):
    """SSE streaming endpoint — streams agent progress live."""
    input_check = validate_input(req.query)
    if not input_check["ok"]:
        raise HTTPException(status_code=400, detail=input_check["reason"])

    return StreamingResponse(
        research_stream(req.query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )