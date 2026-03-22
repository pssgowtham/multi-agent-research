from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import ResearchState
from backend.core.config import settings

STYLE_PROMPTS = {
    "news": "Write like a journalist for a major newspaper. Lead with the most important finding. Use short paragraphs, active voice, and a compelling narrative. Include a strong headline.",
    "statistical": "Write a data-driven analysis. Prioritize numbers, percentages, comparisons, and statistics. Use tables where possible. Every claim must be backed by a figure.",
    "educational": "Write for someone new to this topic. Define technical terms. Use analogies and examples. Break complex ideas into simple steps. Include a glossary if needed.",
    "executive": "Write a C-suite executive briefing. Start with a 2-3 sentence summary of the most critical insight. Use bullet points throughout. Focus on business implications, risks, and recommended actions. Be direct and concise — no fluff.",
    "business": "Write a business-oriented report. Focus on market opportunities, competitive landscape, ROI implications, and strategic recommendations.",
    "progress": "Write a status and progress report. Structure it as: current state, recent developments, key milestones, blockers, and next steps."
}

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=settings.OPENAI_API_KEY
)

def writer_node(state: ResearchState) -> ResearchState:
    try:
        style = state.get("report_type", "executive")
        style_instruction = STYLE_PROMPTS.get(style, STYLE_PROMPTS["executive"])

        analyst_output = state['analyst_output'].replace('\x00', '').strip()

        feedback_section = ""
        if state["critic_feedback"]:
            feedback_section = f"""
            Previous feedback to address:
            {state["critic_feedback"]}
            """

        messages = [
            SystemMessage(content=f"""You are a professional research writer.
            {style_instruction}

            The report must include these sections in Markdown:
            # [Topic Title]
            ## Executive Summary
            ## Key Findings
            ## Analysis
            ## Conclusion
            ## Sources

            Be factual, clear and professional."""),
            HumanMessage(content=f"""
            Topic: {state['query']}

            Research findings:
            {analyst_output}
            {feedback_section}

            Write a complete research report.
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