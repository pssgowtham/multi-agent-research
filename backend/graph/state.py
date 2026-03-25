from typing import TypedDict, Annotated
import operator

class ResearchState(TypedDict):
    # Input
    query: str
    report_type: str
    report_length: str          # "concise" | "medium" | "long"
    is_time_sensitive: bool     # skips Pinecone cache if True

    # Planner
    search_queries: list
    planner_output: str

    # Search
    search_results: str

    # Analyst
    analyst_structured: dict    # cleaned data, stats, contradictions, trends
    analyst_output: str

    # Writer
    writer_output: str

    # Critic
    critic_feedback: str
    critic_approved: bool

    # Shared
    final_answer: str
    iterations: int
    error: str