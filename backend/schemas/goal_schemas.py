from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GoalBase(BaseModel):
    title: str

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    category: Optional[str] = None
    experience_level: Optional[str] = None
    hours_per_week: Optional[int] = None
    budget_usd: Optional[int] = None
    deadline_weeks: Optional[int] = None

class GoalResponse(GoalBase):
    id: str
    user_id: str
    category: Optional[str]
    experience_level: Optional[str]
    hours_per_week: Optional[int]
    budget_usd: Optional[int]
    deadline_weeks: Optional[int]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
