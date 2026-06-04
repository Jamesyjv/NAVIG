import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Date, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    goal_id = Column(String(36), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    task = Column(String, nullable=False)
    why = Column(String, nullable=True)
    estimated_minutes = Column(Integer, nullable=True)
    priority = Column(String, default="high")
    date = Column(Date, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    goal = relationship("Goal")
