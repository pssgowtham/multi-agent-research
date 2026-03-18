from backend.agents.researcher import ResearchState
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.tools.memory import retrieve_research
from backend.core.config import settings
from backend.graph.state import ResearchState

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
)

def analyst_node(state: ResearchState) -> ResearchState:
    """Retrieves from Pinecone and produces structured insights."""
    try:
        # Retrieve most relevant chunks from Pinecone
        relevant_chunks = retrieve_research(
            query=state["query"],
            top_k=5
        )

        context = "\n\n---\n\n".join(relevant_chunks)

        messages = [
            SystemMessage(content="""You are a research analyst.
            Given research findings, produce a structured analysis with:
            1. Key Findings (3-5 bullet points)
            2. Main Themes (2-3 themes)
            3. Conclusion (2-3 sentences)
            Be concise and factual. Only use the provided context."""),
            HumanMessage(content=f"""
            Topic: {state['query']}

            Research findings:
            {context}

            Produce a structured analysis.
            """)
        ]

        response = llm.invoke(messages)

        return {
            **state,
            "analyst_output": response.content,
            "final_answer": response.content,
            "error": ""
        }
    except Exception as e:
        return {**state, "error": str(e)}