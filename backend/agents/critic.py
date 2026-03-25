from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import ResearchState
from backend.core.config import settings

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=settings.OPENAI_API_KEY
)

LENGTH_WORD_TARGETS = {
    "concise": (350, 450),
    "medium": (700, 900),
    "long": (1400, 1800)
}


def critic_node(state: ResearchState) -> ResearchState:
    """Reviews report against type and length requirements."""
    try:
        report_type = state.get("report_type", "executive")
        report_length = state.get("report_length", "medium")
        word_range = LENGTH_WORD_TARGETS.get(report_length, (700, 900))
        word_count = len(state["writer_output"].split())

        # Check length first — no LLM needed
        too_short = word_count < word_range[0] * 0.85
        too_long = word_count > word_range[1] * 1.15

        length_feedback = ""
        if too_short:
            length_feedback = f"Report is too short ({word_count} words). Target is {word_range[0]}-{word_range[1]} words. Expand the analysis."
        elif too_long:
            length_feedback = f"Report is too long ({word_count} words). Target is {word_range[0]}-{word_range[1]} words. Trim redundant content."

        messages = [
            SystemMessage(content=f"""You are a research critic reviewing a {report_type} report.
            Evaluate against these criteria:

            1. Style fit — does it match {report_type} format and tone?
            2. Data usage — are statistics and facts used effectively?
            3. Insight quality — are insights specific and non-obvious?
            4. Structure — are all required sections present and logical?
            5. Accuracy — no invented facts or unsupported claims?

            Be reasonable. Approve if the report adequately meets the criteria.
            Only reject if there are clear, specific problems worth fixing.

            Respond in exactly this format:
            APPROVED: true or false
            FEEDBACK: specific feedback (if approved write 'None')"""),
            HumanMessage(content=f"""
            Topic: {state['query']}
            Report type: {report_type}
            Report length target: {report_length} ({word_range[0]}-{word_range[1]} words)
            Actual word count: {word_count}
            {f'Length issue: {length_feedback}' if length_feedback else ''}

            Report to review:
            {state['writer_output'][:3000]}
            """)
        ]

        response = llm.invoke(messages)
        content = response.content.strip()

        approved = False
        feedback = length_feedback or ""

        for line in content.split("\n"):
            if line.startswith("APPROVED:"):
                approved = "true" in line.lower()
            elif line.startswith("FEEDBACK:"):
                llm_feedback = line.replace("FEEDBACK:", "").strip()
                if llm_feedback != "None":
                    feedback = f"{feedback} {llm_feedback}".strip()

        # Force reject if length is wrong
        if length_feedback:
            approved = False

        return {
            **state,
            "critic_feedback": feedback,
            "critic_approved": approved,
            "error": ""
        }
    except Exception as e:
        return {
            **state,
            "error": str(e),
            "critic_approved": False
        }