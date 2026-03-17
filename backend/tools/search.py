from exa_py import Exa
from langchain_core.tools import tool
from backend.core.config import settings

exa = Exa(api_key=settings.EXA_API_KEY)

@tool
def exa_search(query: str) -> str:
    """Search the web sementically using Exa"""
    try:
        results = exa.search_and_contents(
            query, 
            num_results=5,
            text={"max_characters": 1000}
        )
        output = []
        for r in results.results:
            output.append(f"Title: {r.title}\nURL: {r.url}\nText: {r.text}\n")
        
        return "\n--\n".join(output)
    except Exception as e:
        return f"Error searching the web: {str(e)}"

        