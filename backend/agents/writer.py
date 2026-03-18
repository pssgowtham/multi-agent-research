from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import ResearchState
from backend.core.config import settings

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,  # slightly creative for better writing
    api_key=settings.OPENAI_API_KEY
)

def writer_node(state: ResearchState) -> ResearchState:
    """Takes analyst output and writes a polished markdown report."""
    try:
        # Include critic feedback if this is a revision
        feedback_section = ""
        if state["critic_feedback"]:
            feedback_section = f"""
            Previous feedback to address:
            {state["critic_feedback"]}
            """

        messages = [
            SystemMessage(content="""You are a professional research writer.
            Write a polished, well-structured research report in Markdown.
            The report must include:
            # [Topic Title]
            ## Executive Summary (2-3 sentences)
            ## Key Findings (bullet points with detail)
            ## Analysis (2-3 paragraphs)
            ## Conclusion (1 paragraph)
            ## Sources (list any URLs mentioned in the research)
            Be factual, clear and professional."""),
            HumanMessage(content=f"""
            Topic: {state['query']}

            Research findings:
            {state['analyst_output']}
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