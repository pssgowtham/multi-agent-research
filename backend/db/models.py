from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from backend.db.database import Base
import uuid

class ResearchHistory(Base):
    __tablename__ = "research_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query = Column(String, nullable=False)
    final_answer = Column(Text, nullable=False)
    search_queries = Column(JSONB, nullable=True)
    timeline = Column(JSONB, nullable=True)
    critic_approved = Column(Boolean, default=False)
    iterations = Column(Integer, default=0)
    report_type = Column(String, nullable=True, default="executive")
    report_length = Column(String, nullable=True, default="medium")
    is_bookmarked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
