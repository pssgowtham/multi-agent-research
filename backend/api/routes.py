from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.graph.research_graph import run_research
from backend.core.guards import validate_input, validate_output
from backend.db.database import get_db
from backend.db.models import ResearchHistory
import json
import asyncio
import time

router = APIRouter()


class ResearchRequest(BaseModel):
    query: str


async def research_stream(query: str, db: AsyncSession):
    """Async generator that streams agent progress via SSE."""
    try:
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
        loop = asyncio.get_event_loop()

        yield f"data: {json.dumps({'type': 'start', 'message': 'Research started'})}\n\n"

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

        # Validate output
        output_check = validate_output(
            output=state["final_answer"],
            source_material=state["search_results"]
        )
        if not output_check["ok"]:
            yield f"data: {json.dumps({'type': 'error', 'message': output_check['reason']})}\n\n"
            return

        # Save to Supabase
        record = ResearchHistory(
            query=query,
            final_answer=state["final_answer"],
            search_queries=state["search_queries"],
            timeline=timeline,
            critic_approved=state["critic_approved"],
            iterations=state["iterations"]
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)

        yield f"data: {json.dumps({'type': 'result', 'data': {**state, 'timeline': timeline, 'id': str(record.id)}})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/research/stream")
async def research_stream_endpoint(
    req: ResearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """SSE streaming endpoint."""
    input_check = validate_input(req.query)
    if not input_check["ok"]:
        raise HTTPException(status_code=400, detail=input_check["reason"])

    return StreamingResponse(
        research_stream(req.query, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/history")
async def get_history(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get past research queries."""
    result = await db.execute(
        select(ResearchHistory)
        .order_by(desc(ResearchHistory.created_at))
        .limit(limit)
    )
    records = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "query": r.query,
            "critic_approved": r.critic_approved,
            "iterations": r.iterations,
            "timeline": r.timeline,
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]


@router.get("/history/{id}")
async def get_history_item(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific past research report."""
    result = await db.execute(
        select(ResearchHistory).where(ResearchHistory.id == id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": str(record.id),
        "query": record.query,
        "final_answer": record.final_answer,
        "search_queries": record.search_queries,
        "timeline": record.timeline,
        "critic_approved": record.critic_approved,
        "iterations": record.iterations,
        "created_at": record.created_at.isoformat()
    }