from typing import TypedDict, Annotated
import operator

class ResearchState(TypedDict):
    query: str
    #planner agent
    report_type: str
    search_queries: list[str]
    planner_output: str
    #search agent
    search_results: str
    #analyst agent
    analyst_output: str
    #writer agent
    writer_output: str
    #critic agent
    critic_feedback: str
    critic_approved: bool
    #final answer
    final_answer: str
    iterations: int
    error: str