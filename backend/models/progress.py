import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

class Progress(Base):
    __tablename__ = "progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    goal_id = Column(String(36), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, unique=True)
    streak_days = Column(Integer, default=0)
    max_streak_days = Column(Integer, default=0)
    missions_done = Column(Integer, default=0)
    days_active = Column(Integer, default=0)
    current_week = Column(Integer, default=1)
    last_activity_date = Column(Date, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    goal = relationship("Goal")
