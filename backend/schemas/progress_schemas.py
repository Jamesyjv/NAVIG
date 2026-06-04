from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class MilestoneProgressResponse(BaseModel):
    id: str
    title: str
    week_number: int
    completed: bool
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ProgressResponse(BaseModel):
    percent_complete: int
    streak_days: int
    missions_done: int
    days_active: int
    current_week: int
    milestones: List[MilestoneProgressResponse]
    motivational_line: str
