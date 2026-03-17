from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from backend.tools.search import exa_search
from backend.tools.memory import store_research
from backend.core.config import settings
import uuid

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
)

def search_node(state: dict) -> dict:
    """Takes planner queries, searches Exa, stores results in Pinecone."""
    try:
        agent = create_react_agent(llm, tools=[exa_search])
        all_results = []

        for query in state["search_queries"]:
            result = agent.invoke({
                "messages": [{"role": "user", "content": f"Search for: {query}"}]
            })
            content = result["messages"][-1].content

            # Store in Pinecone
            store_research(
                text=content,
                metadata={
                    "id": str(uuid.uuid4()),
                    "query": query,
                    "original_topic": state["query"]
                }
            )
            all_results.append(f"Query: {query}\nFindings: {content}")

        return {
            **state,
            "search_results": "\n\n---\n\n".join(all_results),
            "error": ""
        }
    except Exception as e:
        return {**state, "error": str(e)}