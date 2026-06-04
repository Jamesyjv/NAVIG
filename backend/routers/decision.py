from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap, Milestone
from backend.models.progress import Progress
from backend.models.decision import Decision
from backend.services.profile_builder import build_user_context
from backend.services.ai_service import ask_decision
from backend.routers.auth import get_current_user
from backend.schemas.decision_schemas import DecisionAsk, DecisionResponse

router = APIRouter(prefix="/decision", tags=["decision"])

@router.post("/ask", response_model=DecisionResponse)
async def ask_advisor(decision_in: DecisionAsk, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Verify goal
    goal = db.query(Goal).filter(Goal.id == decision_in.goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # 2. Fetch progress and roadmap details
    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if not progress:
        progress = Progress(goal_id=goal.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)

    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal.id).first()
    milestones_total = 0
    milestones_done = 0
    if roadmap:
        milestones_total = db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id).count()
        milestones_done = db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id, Milestone.completed == True).count()

    percent_complete = int((milestones_done / milestones_total) * 100) if milestones_total > 0 else 0

    # 3. Build user context
    user_context = build_user_context(
        user=current_user,
        goal=goal,
        progress=progress,
        milestones_done=milestones_done,
        milestones_total=milestones_total,
        percent_complete=percent_complete
    )

    # 4. Call Claude
    ai_answer = await ask_decision(user_context=user_context, question=decision_in.question)

    # 5. Save Decision to DB
    decision = Decision(
        user_id=current_user.id,
        goal_id=goal.id,
        question=decision_in.question,
        ai_answer=ai_answer
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)

    return decision

@router.get("/history", response_model=List[DecisionResponse])
def get_decision_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch active goal
    goal = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "active").first()
    if not goal:
        return []

    # Get history ordered by created_at desc (most recent first)
    history = db.query(Decision).filter(
        Decision.user_id == current_user.id,
        Decision.goal_id == goal.id
    ).order_by(Decision.created_at.desc()).all()

    return history
