from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class MissionBase(BaseModel):
    task: str
    why: Optional[str] = None
    estimated_minutes: Optional[int] = None
    priority: str = "high"
    date: date

class MissionResponse(MissionBase):
    id: str
    goal_id: str
    completed: bool
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
