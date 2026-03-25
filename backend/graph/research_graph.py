from langgraph.graph import StateGraph, START, END
from backend.graph.state import ResearchState
from backend.agents.planner import planner_node
from backend.agents.search import search_node
from backend.agents.analyst import analyst_node
from backend.agents.writer import writer_node
from backend.agents.critic import critic_node
from backend.core.config import settings


def should_rewrite(state: ResearchState) -> str:
    if state["iterations"] >= settings.MAX_CRITIC_ITERATIONS:
        return "end"
    if state["critic_approved"]:
        return "end"
    return "rewrite"


def build_research_graph():
    graph = StateGraph(ResearchState)

    graph.add_node("planner", planner_node)
    graph.add_node("search", search_node)
    graph.add_node("analyst", analyst_node)
    graph.add_node("writer", writer_node)
    graph.add_node("critic", critic_node)

    graph.add_edge(START, "planner")
    graph.add_edge("planner", "search")
    graph.add_edge("search", "analyst")
    graph.add_edge("analyst", "writer")
    graph.add_edge("writer", "critic")

    graph.add_conditional_edges(
        "critic",
        should_rewrite,
        {"rewrite": "writer", "end": END}
    )

    return graph.compile()


def run_research(query: str, report_type: str = "executive", report_length: str = "medium") -> dict:
    graph = build_research_graph()
    return graph.invoke({
        "query": query,
        "report_type": report_type,
        "report_length": report_length,
        "is_time_sensitive": False,
        "search_queries": [],
        "planner_output": "",
        "search_results": "",
        "analyst_structured": {},
        "analyst_output": "",
        "writer_output": "",
        "critic_feedback": "",
        "critic_approved": False,
        "final_answer": "",
        "iterations": 0,
        "error": ""
    })