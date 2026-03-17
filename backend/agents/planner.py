from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.core.config import settings

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
)

def planner_node(state: dict) -> dict:
    """Breaks the user query into a structured research plan."""
    try:
        messages = [
            SystemMessage(content="""You are a research planner. 
            Given a topic, break it down into 3 specific search queries 
            that together will give comprehensive coverage of the topic.
            Return ONLY a numbered list of 3 search queries, nothing else.
            Example:
            1. query one
            2. query two
            3. query three"""),
            HumanMessage(content=f"Create a research plan for: {state['query']}")
        ]

        response = llm.invoke(messages)

        # Parse the 3 queries from the response
        lines = response.content.strip().split("\n")
        search_queries = []
        for line in lines:
            line = line.strip()
            if line and line[0].isdigit():
                # Remove the number and dot prefix
                query = line.split(".", 1)[-1].strip()
                search_queries.append(query)

        return {
            **state,
            "search_queries": search_queries,
            "planner_output": response.content
        }
    except Exception as e:
        return {**state, "error": str(e)}