from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import ResearchState
from backend.core.config import settings

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
)

def critic_node(state: ResearchState) -> ResearchState:
    """Reviews the writer's report and either approves or rejects with feedback."""
    try:
        messages = [
            SystemMessage(content="""You are a strict research critic.
            Review the report against these 3 criteria:
            1. Completeness — does it cover the topic thoroughly?
            2. Accuracy — are claims supported by the research?
            3. Clarity — is it well structured and easy to read?

            Respond in exactly this format:
            APPROVED: true or false
            FEEDBACK: your specific feedback here (if approved write 'None')
            """),
            HumanMessage(content=f"""
            Original topic: {state['query']}

            Report to review:
            {state['writer_output']}

            Review this report strictly.
            """)
        ]

        response = llm.invoke(messages)
        content = response.content.strip()

        # Parse the response
        approved = False
        feedback = ""

        for line in content.split("\n"):
            if line.startswith("APPROVED:"):
                approved = "true" in line.lower()
            elif line.startswith("FEEDBACK:"):
                feedback = line.replace("FEEDBACK:", "").strip()

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