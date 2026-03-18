from typing import TypedDict, Annotated
import operator

class ResearchState(TypedDict):
    query: str
    #planner agent
    search_queries: list[str]
    planner_output: str
    #search agent
    search_results: str
    #analyst agent
    analyst_output: str
    #shared
    final_answer: str
    iterations: int
    error: str