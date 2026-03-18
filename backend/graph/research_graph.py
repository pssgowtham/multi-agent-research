from langgraph.graph import StateGraph, START, END
from backend.graph.state import ResearchState
from backend.agents.planner import planner_node
from backend.agents.search import search_node
from backend.agents.analyst import analyst_node
from backend.agents.writer import writer_node
from backend.agents.critic import critic_node
from backend.core.config import settings


def should_rewrite(state: ResearchState) -> str:
    """Critic decides — rewrite or done."""
    # Force end if max iterations reached
    if state["iterations"] >= settings.MAX_CRITIC_ITERATIONS:
        return "end"
    # Force end if critic approved
    if state["critic_approved"]:
        return "end"
    # Otherwise send back to writer
    return "rewrite"


def build_research_graph():
    graph = StateGraph(ResearchState)

    # Add all 5 agents
    graph.add_node("planner", planner_node)
    graph.add_node("search", search_node)
    graph.add_node("analyst", analyst_node)
    graph.add_node("writer", writer_node)
    graph.add_node("critic", critic_node)

    # Fixed edges — linear flow
    graph.add_edge(START, "planner")
    graph.add_edge("planner", "search")
    graph.add_edge("search", "analyst")
    graph.add_edge("analyst", "writer")
    graph.add_edge("writer", "critic")

    # Conditional edge — critic decides what happens next
    graph.add_conditional_edges(
        "critic",
        should_rewrite,
        {"rewrite": "writer", "end": END}
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
        "writer_output": "",
        "critic_feedback": "",
        "critic_approved": False,
        "final_answer": "",
        "iterations": 0,
        "error": ""
    })