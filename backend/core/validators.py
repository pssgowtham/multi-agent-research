from pydantic import BaseModel, field_validator

INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all instructions",
    "disregard your instructions",
    "you are now",
    "act as",
    "pretend you are",
    "forget your",
    "system prompt",
    "jailbreak",
]

class ResearchQuery(BaseModel):
    query: str

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        # Empty check
        if not v or not v.strip():
            raise ValueError("Query cannot be empty")

        # Length check
        if len(v.strip()) < 5:
            raise ValueError("Query too short — minimum 5 characters")

        if len(v) > 500:
            raise ValueError("Query too long — maximum 500 characters")

        # Prompt injection check
        v_lower = v.lower()
        for pattern in INJECTION_PATTERNS:
            if pattern in v_lower:
                raise ValueError(f"Invalid query — contains disallowed pattern")

        return v.strip()