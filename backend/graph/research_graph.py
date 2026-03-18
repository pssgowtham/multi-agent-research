from langgraph.graph import StateGraph, START, END
from backend.graph.state import ResearchState
from backend.agents.planner import planner_node
from backend.agents.search import search_node
from backend.agents.analyst import analyst_node
from backend.core.config import settings


def should_continue(state: ResearchState) -> str:
    """Stop on success or when max iterations reached."""
    if state["error"] == "" and state["final_answer"] != "":
        return "end"
    if state["iterations"] >= settings.MAX_CRITIC_ITERATIONS:
        return "end"
    return "continue"


def build_research_graph():
    graph = StateGraph(ResearchState)

    # Add all 3 agents as nodes
    graph.add_node("planner", planner_node)
    graph.add_node("search", search_node)
    graph.add_node("analyst", analyst_node)

    # Wire the edges
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "search")
    graph.add_edge("search", "analyst")
    graph.add_conditional_edges(
        "analyst",
        should_continue,
        {"continue": "planner", "end": END}
    )

    return graph.compile()


def run_research(query: str) -> dict:
    graph = build_research_graph()
    return graph.invoke({
        "query": query,
        "search_queries": [],
        "planner_output": "",
        "search_results": "",
        "analyst_output": "",
        "final_answer": "",
        "iterations": 0,
        "error": ""
    })