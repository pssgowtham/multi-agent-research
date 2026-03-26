from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.core.guards import validate_input, validate_output
from backend.db.database import get_db
from backend.db.models import ResearchHistory
import json
import asyncio
import time
from fastapi.responses import StreamingResponse, Response
import markdown
import io

router = APIRouter()


class ResearchRequest(BaseModel):
    query: str
    report_type: str = "executive"
    report_length: str = "medium"


async def research_stream(query: str, report_type: str, report_length: str, db: AsyncSession):
    try:
        from backend.agents.planner import planner_node
        from backend.agents.search import search_node
        from backend.agents.analyst import analyst_node
        from backend.agents.writer import writer_node
        from backend.agents.critic import critic_node
        from backend.graph.state import ResearchState

        state: ResearchState = {
            "query": query,
            "report_type": report_type,
            "report_length": report_length,
            "is_time_sensitive": False,
            "search_queries": [],
            "planner_output": "",
            "search_results": "",
            "analyst_structured": {},
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

        # Output guard
        output_check = validate_output(
            output=state["final_answer"],
            source_material=state["search_results"]
        )
        warning = None if output_check["ok"] else output_check["reason"]

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

        yield f"data: {json.dumps({'type': 'result', 'data': {**state, 'timeline': timeline, 'id': str(record.id), 'warning': warning}})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/research/stream")
async def research_stream_endpoint(
    req: ResearchRequest,
    db: AsyncSession = Depends(get_db)
):
    input_check = validate_input(req.query)
    if not input_check["ok"]:
        raise HTTPException(status_code=400, detail=input_check["reason"])

    return StreamingResponse(
        research_stream(req.query, req.report_type, req.report_length, db),
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

@router.get("/report/{id}/pdf")
async def download_pdf(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Convert report to PDF and return as download."""
    result = await db.execute(
        select(ResearchHistory).where(ResearchHistory.id == id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    # Convert markdown to HTML
    html_content = markdown.markdown(
        record.final_answer,
        extensions=['tables', 'fenced_code']
    )

    # Wrap in styled HTML
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: Georgia, serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #1a1a1a;
                max-width: 800px;
                margin: 40px auto;
                padding: 0 40px;
            }}
            h1 {{
                font-size: 22pt;
                border-bottom: 2px solid #1a1a1a;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }}
            h2 {{
                font-size: 15pt;
                margin-top: 28px;
                margin-bottom: 10px;
            }}
            h3 {{
                font-size: 13pt;
                margin-top: 20px;
            }}
            p {{
                margin-bottom: 12px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 10pt;
            }}
            th {{
                background: #f0f0f0;
                padding: 8px 12px;
                text-align: left;
                border: 1px solid #ccc;
                font-weight: bold;
            }}
            td {{
                padding: 8px 12px;
                border: 1px solid #ccc;
            }}
            tr:nth-child(even) {{ background: #fafafa; }}
            ul, ol {{
                margin-bottom: 12px;
                padding-left: 24px;
            }}
            li {{ margin-bottom: 4px; }}
            strong {{ font-weight: bold; }}
            .header {{
                border-bottom: 1px solid #ccc;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 10px;
                border-top: 1px solid #ccc;
                font-size: 9pt;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <p style="color: #666; font-size: 10pt;">Multi-Agent Research Report</p>
            <p style="color: #666; font-size: 10pt;">Query: {record.query}</p>
        </div>
        {html_content}
        <div class="footer">
            Generated by Multi-Agent Research System
        </div>
    </body>
    </html>
    """

    # Generate PDF
    from weasyprint import HTML
    pdf_bytes = HTML(string=styled_html).write_pdf()

    filename = record.query[:50].replace(' ', '_').replace('/', '_')

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.pdf"'
        }
    )


@router.get("/report/{id}/markdown")
async def download_markdown(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    """Return report as markdown file download."""
    result = await db.execute(
        select(ResearchHistory).where(ResearchHistory.id == id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    filename = record.query[:50].replace(' ', '_').replace('/', '_')

    return Response(
        content=record.final_answer,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}.md"'
        }
    )

