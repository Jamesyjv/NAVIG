from pydantic import BaseModel
from datetime import datetime

class DecisionAsk(BaseModel):
    goal_id: str
    question: str

class DecisionResponse(BaseModel):
    id: str
    user_id: str
    goal_id: str
    question: str
    ai_answer: str
    created_at: datetime

    class Config:
        from_attributes = True
