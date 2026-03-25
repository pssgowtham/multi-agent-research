from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import ResearchState
from backend.core.config import settings

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=settings.OPENAI_API_KEY
)

STYLE_PROMPTS = {
    "executive": "Write a C-suite executive briefing. Start with a 2-3 sentence summary of the most critical insight. Use bullet points throughout. Focus on business implications, risks, and recommended actions. Be direct and concise — no fluff.",
    "news": "Write like a journalist for a major newspaper. Lead with the most important finding. Use short paragraphs, active voice, and a compelling narrative. Include a strong headline.",
    "statistical": "Write a data-driven analysis. Prioritize numbers, percentages, comparisons, and statistics. Use tables where possible. Every claim must be backed by a figure.",
    "educational": "Write for someone new to this topic. Define technical terms. Use analogies and examples. Break complex ideas into simple steps. Include a glossary if needed.",
    "business": "Write a business-oriented report. Focus on market opportunities, competitive landscape, ROI implications, and strategic recommendations.",
    "progress": "Write a status and progress report. Structure it as: current state, recent developments, key milestones, blockers, and next steps."
}

LENGTH_TARGETS = {
    "concise": {
        "words": "350-450",
        "pages": "< 1 page",
        "instruction": "Be extremely concise. Every sentence must earn its place. No repetition."
    },
    "medium": {
        "words": "700-900",
        "pages": "1-2 pages",
        "instruction": "Cover the topic thoroughly but avoid padding. Balance depth with readability."
    },
    "long": {
        "words": "1400-1800",
        "pages": "3-4 pages",
        "instruction": "Provide comprehensive coverage. Include detailed analysis, examples, and supporting evidence."
    }
}


def writer_node(state: ResearchState) -> ResearchState:
    """Writes the final report using analyst structured output."""
    try:
        report_type = state.get("report_type", "executive")
        report_length = state.get("report_length", "medium")

        style = STYLE_PROMPTS.get(report_type, STYLE_PROMPTS["executive"])
        length = LENGTH_TARGETS.get(report_length, LENGTH_TARGETS["medium"])

        # Use structured analyst output
        structured = state.get("analyst_structured", {})
        stats = structured.get("statistics", "")
        trends = structured.get("trends", "")
        predictions = structured.get("predictions", "")
        insights = structured.get("insights", "")
        contradictions = structured.get("contradictions", "")
        comparison = structured.get("cross_source_comparison", "")

        feedback_section = ""
        if state["critic_feedback"]:
            feedback_section = f"""
            Previous critic feedback to address:
            {state["critic_feedback"]}
            """

        messages = [
            SystemMessage(content=f"""You are a professional research writer.

STYLE: {style}

LENGTH: Target {length['words']} words ({length['pages']}).
{length['instruction']}

STRUCTURE (in Markdown):
# [Compelling Title]
## Executive Summary
## Key Findings
## Analysis
## Data & Statistics (include tables where relevant)
## Contradictions & Caveats (if any)
## Conclusion
## Sources

RULES:
- Use the provided data — do not invent facts
- Include specific numbers and statistics where available
- {feedback_section if feedback_section else 'Make it publication-ready'}"""),

            HumanMessage(content=f"""
Topic: {state['query']}
Report type: {report_type}
Target length: {length['words']} words

KEY INSIGHTS:
{insights}

STATISTICS:
{stats}

TRENDS:
{trends}

PREDICTIONS:
{predictions}

CONTRADICTIONS:
{contradictions}

CROSS-SOURCE COMPARISON:
{comparison}

Write the complete report now.
""")
        ]

        response = llm.invoke(messages)

        return {
            **state,
            "writer_output": response.content,
            "final_answer": response.content,
            "iterations": state["iterations"] + 1,
            "error": ""
        }
    except Exception as e:
        return {
            **state,
            "error": str(e),
            "iterations": state["iterations"] + 1
        }