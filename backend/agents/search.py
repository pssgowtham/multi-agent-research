from exa_py import Exa
from backend.tools.memory import store_research, retrieve_research
from backend.core.config import settings
from backend.graph.state import ResearchState
import uuid

exa = Exa(api_key=settings.EXA_API_KEY)

def search_node(state: ResearchState) -> ResearchState:
    try:
        all_results = []

        for query in state["search_queries"]:
            # Check Pinecone cache — skip for time sensitive topics
            if not is_time_sensitive(state["query"]):
                cached = retrieve_research(state["query"], top_k=1, min_score=0.65)
                if cached and len(cached[0]) > 200:
                    all_results.append(f"Query: {query}\nFindings: {cached[0]}")
                    continue

            # Direct Exa call — no LLM involved
            results = exa.search_and_contents(
                query,
                num_results=5,
                text={"max_characters": 1000}
            )

            content = "\n---\n".join([
                f"Title: {r.title}\nURL: {r.url}\nContent: {r.text}"
                for r in results.results
            ])

            # Store raw results in Pinecone
            store_research(
                text=content,
                metadata={
                    "id": str(uuid.uuid4()),
                    "query": state["query"],
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


TIME_SENSITIVE_KEYWORDS = [
    'ipl', 'cricket', 'stock', 'price', 'war', 'election',
    'news', 'today', 'latest', 'current', 'match', 'score'
]

def is_time_sensitive(query: str) -> bool:
    return any(kw in query.lower() for kw in TIME_SENSITIVE_KEYWORDS)