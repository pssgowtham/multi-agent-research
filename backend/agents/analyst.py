from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.tools.memory import retrieve_research
from backend.graph.state import ResearchState
from backend.core.config import settings
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
)


def run_step(system: str, user: str) -> str:
    """Helper — runs a single focused LLM step."""
    response = llm.invoke([
        SystemMessage(content=system),
        HumanMessage(content=user)
    ])
    return response.content.strip()


def analyst_node(state: ResearchState) -> ResearchState:
    try:
        raw_data = state["search_results"]

        # Step 1 — Data cleaning (must run first)
        cleaned = run_step(
            system="""You are a data cleaning specialist.
            Remove duplicate information, irrelevant content and noise.
            Keep all factual information, numbers, dates, statistics and URLs.
            Return cleaned structured text.""",
            user=f"Topic: {state['query']}\n\nRaw data:\n{raw_data[:6000]}"
        )

        # Steps 2-5 run in parallel — they're independent
        with ThreadPoolExecutor(max_workers=4) as executor:
            stats_future = executor.submit(run_step,
                """Extract ALL numerical data: percentages, dates, financial figures,
                rankings, counts, measurable metrics.
                Format as a clear list.""",
                f"Extract statistics from:\n{cleaned}"
            )
            comparison_future = executor.submit(run_step,
                """Compare information across sources.
                Identify: points of agreement, points of disagreement,
                most authoritative sources.""",
                f"Topic: {state['query']}\n\nCompare sources:\n{cleaned}"
            )
            contradictions_future = executor.submit(run_step,
                """Find contradictions or conflicting claims.
                For each: what claim A says, what claim B says,
                which is more likely accurate.
                If none write 'No contradictions detected'.""",
                f"Find contradictions in:\n{cleaned}"
            )
            trends_future = executor.submit(run_step,
                """Identify patterns and trends:
                historical trends, current trajectory, key inflection points.
                Use specific data points.""",
                f"Topic: {state['query']}\n\nAnalyze trends in:\n{cleaned}"
            )

            stats = stats_future.result()
            comparison = comparison_future.result()
            contradictions = contradictions_future.result()
            trends = trends_future.result()

        # Steps 6-7 run in parallel — both depend on above
        with ThreadPoolExecutor(max_workers=2) as executor:
            predictions_future = executor.submit(run_step,
                """Provide:
                DIAGNOSTIC: What caused the current situation?
                PREDICTIVE: What is likely to happen next?
                PRESCRIPTIVE: What actions does this suggest?
                Ground every claim in the data.""",
                f"Topic: {state['query']}\nTrends:\n{trends}\nStats:\n{stats}"
            )
            insights_future = executor.submit(run_step,
                f"""Synthesize into 5-7 sharp insights for a {state.get('report_type', 'executive')} report.
                Each insight must be specific, data-backed, and non-obvious.
                Format as numbered list.""",
                f"""Topic: {state['query']}
                Stats: {stats}
                Trends: {trends}
                Contradictions: {contradictions}"""
            )

            predictions = predictions_future.result()
            insights = insights_future.result()

        analyst_structured = {
            "cleaned_data": cleaned,
            "statistics": stats,
            "cross_source_comparison": comparison,
            "contradictions": contradictions,
            "trends": trends,
            "predictions": predictions,
            "insights": insights
        }

        analyst_output = f"""## Statistics
{stats}

## Trends
{trends}

## Contradictions
{contradictions}

## Predictions
{predictions}

## Key Insights
{insights}"""

        return {
            **state,
            "analyst_structured": analyst_structured,
            "analyst_output": analyst_output,
            "error": ""
        }
    except Exception as e:
        return {**state, "error": str(e)}
    """7-step analytical pipeline over raw Exa results."""
    try:
        # Retrieve all relevant data from Pinecone
        chunks = retrieve_research(state["query"], top_k=10, min_score=0.0)
        raw_data = state["search_results"]

        # ── Step 1: Data Cleaning ──────────────────────────────
        cleaned = run_step(
            system="""You are a data cleaning specialist.
            Remove duplicate information, irrelevant content, and noise.
            Keep only factual, relevant information about the topic.
            Preserve all numbers, dates, statistics and source URLs.
            Return the cleaned data as structured text.""",
            user=f"Topic: {state['query']}\n\nRaw data:\n{raw_data[:6000]}"
        )

        # ── Step 2: Statistical Extraction ────────────────────
        stats = run_step(
            system="""You are a statistical data extractor.
            Extract ALL numerical data from the text:
            - Percentages, ratios, growth rates
            - Dates and timelines
            - Financial figures
            - Rankings and counts
            - Any measurable metrics
            Format as a clear list. If no stats found write 'No statistical data found'.""",
            user=f"Extract all statistics from:\n{cleaned}"
        )

        # ── Step 3: Cross-Source Comparison ───────────────────
        comparison = run_step(
            system="""You are a source comparison analyst.
            Compare information across different sources.
            Identify:
            - Points where sources agree
            - Points where sources disagree
            - Which sources seem most authoritative
            Be specific about which sources say what.""",
            user=f"Topic: {state['query']}\n\nData from multiple sources:\n{cleaned}"
        )

        # ── Step 4: Contradiction Detection ───────────────────
        contradictions = run_step(
            system="""You are a fact-checking specialist.
            Identify any contradictions or conflicting claims in the data.
            For each contradiction explain:
            - What claim A says
            - What claim B says  
            - Which is more likely accurate and why
            If no contradictions found write 'No contradictions detected'.""",
            user=f"Find contradictions in:\n{cleaned}"
        )

        # ── Step 5: Trend Analysis ────────────────────────────
        trends = run_step(
            system="""You are a trend analyst.
            Identify patterns and trends in the data:
            - Historical trends (what changed over time)
            - Current trajectory (where things are heading)
            - Key inflection points (what caused major changes)
            Use specific data points to support each trend.""",
            user=f"Topic: {state['query']}\n\nAnalyze trends in:\n{cleaned}\n\nStats:\n{stats}"
        )

        # ── Step 6: Predictive & Diagnostic Modeling ──────────
        predictions = run_step(
            system="""You are a predictive analyst.
            Based on the data provide:
            DIAGNOSTIC: What caused the current situation? (root cause analysis)
            PREDICTIVE: What is likely to happen next? (evidence-based forecast)
            PRESCRIPTIVE: What actions or decisions does this suggest?
            Ground every claim in the data provided.""",
            user=f"Topic: {state['query']}\n\nTrends:\n{trends}\n\nStats:\n{stats}"
        )

        # ── Step 7: Insight Generation ────────────────────────
        report_type = state.get("report_type", "executive")
        insights = run_step(
            system=f"""You are an insights specialist for {report_type} reports.
            Synthesize all analysis into 5-7 sharp, actionable insights.
            Each insight must be:
            - Specific (backed by data)
            - Relevant to a {report_type} audience
            - Non-obvious (not just restating facts)
            Format as numbered list.""",
            user=f"""Topic: {state['query']}
            Stats: {stats}
            Trends: {trends}
            Predictions: {predictions}
            Contradictions: {contradictions}
            Generate insights for a {report_type} report."""
        )

        # Package structured output for Writer
        analyst_structured = {
            "cleaned_data": cleaned,
            "statistics": stats,
            "cross_source_comparison": comparison,
            "contradictions": contradictions,
            "trends": trends,
            "predictions": predictions,
            "insights": insights
        }

        # Build analyst_output summary for backward compatibility
        analyst_output = f"""## Statistics
{stats}

## Trends
{trends}

## Contradictions
{contradictions}

## Predictions
{predictions}

## Key Insights
{insights}"""

        return {
            **state,
            "analyst_structured": analyst_structured,
            "analyst_output": analyst_output,
            "error": ""
        }
    except Exception as e:
        return {**state, "error": str(e)}