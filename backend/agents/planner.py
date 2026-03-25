from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.graph.state import ResearchState
from backend.core.config import settings

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
)

TIME_SENSITIVE_KEYWORDS = [
    'ipl', 'cricket', 'football', 'sports', 'match', 'score',
    'stock', 'price', 'market', 'crypto', 'bitcoin',
    'war', 'election', 'news', 'today', 'latest', 'current',
    'weather', 'covid', 'breaking', '2024', '2025', '2026'
]

def is_time_sensitive(query: str) -> bool:
    return any(kw in query.lower() for kw in TIME_SENSITIVE_KEYWORDS)


def planner_node(state: ResearchState) -> ResearchState:
    """Breaks the user query into 5 specific search queries."""
    try:
        time_sensitive = is_time_sensitive(state["query"])

        messages = [
            SystemMessage(content="""You are a research planner.
            Given a topic, generate exactly 5 specific search queries that together
            give comprehensive coverage of the topic.

            Each query should target a different angle:
            1. Core facts and overview
            2. Latest developments and recent data
            3. Statistical data and numbers
            4. Expert analysis and opinions
            5. Future outlook and predictions

            Return ONLY a numbered list of 5 queries, nothing else.
            Example:
            1. query one
            2. query two
            3. query three
            4. query four
            5. query five"""),
            HumanMessage(content=f"Create a research plan for: {state['query']}")
        ]

        response = llm.invoke(messages)

        lines = response.content.strip().split("\n")
        search_queries = []
        for line in lines:
            line = line.strip()
            if line and line[0].isdigit():
                query = line.split(".", 1)[-1].strip()
                search_queries.append(query)

        return {
            **state,
            "search_queries": search_queries[:5],
            "planner_output": response.content,
            "is_time_sensitive": time_sensitive,
            "error": ""
        }
    except Exception as e:
        return {**state, "error": str(e)}