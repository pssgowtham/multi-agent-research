from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from typing import TypedDict, Annotated
import operator

from backend.tools.search import exa_search
from backend.core.config import settings

class ResearchState(TypedDict):
    query: str
    research_results: Annotated[str, operator.add]
    final_answer: str
    iterations: int
    error: str

llm = ChatOpenAI(
    model="gpt-4o-mini", 
    temperature=0,
    api_key=settings.OPENAI_API_KEY
    )

def research_node(state: ResearchState) -> ResearchState:
    try:
        agent = create_react_agent(llm, tools=[exa_search])
        result = agent.invoke({
            "messages": [{"role": "user", "content": f"Research this topic thoroughly: {state['query']}"}]})
        final = result["messages"][-1].content
        return {
            **state,
            "research_results": final,
            "final_answer": final,
            "error": "",
            "iterations": state['iterations'] + 1
        }
    except Exception as e:
        return {
            **state,
            "error": str(e),
            "iterations": state['iterations'] + 1
        }

def should_continue(state: ResearchState) -> str:
    if state['error'] == "" and state['research_results'] != "":
        return "end"
    if state['iterations'] >= settings.MAX_CRITIC_ITERATIONS:
        return "end"
    return "continue"

def build_research_graph():
    graph = StateGraph(ResearchState)
    graph.add_node("researcher", research_node)
    graph.add_edge(START, "researcher")
    graph.add_conditional_edges(
        "researcher",
        should_continue,
        {"continue": "researcher", "end": END}
    )
    return graph.compile()

def run_research(query: str) -> dict:
    graph = build_research_graph()
    return graph.invoke({
        "query": query, 
        "research_results": "", 
        "final_answer": "", 
        "iterations": 0, 
        "error": ""
    })



