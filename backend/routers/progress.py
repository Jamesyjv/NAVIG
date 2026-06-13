from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap, Milestone
from backend.models.mission import Mission
from backend.models.progress import Progress
from backend.routers.auth import get_current_user

router = APIRouter(tags=["progress"])


# ── Response schemas ────────────────────────────────────────────────────────

class MilestoneProgressOut(BaseModel):
    id: str
    title: str
    week_number: int
    completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProgressOut(BaseModel):
    # Counts the frontend uses
    total_milestones: int
    completed_milestones: int
    total_missions: int
    completed_missions: int
    # Stats
    streak_days: int
    missions_done: int
    days_active: int
    current_week: int
    percent_complete: int
    motivational_line: str
    milestones: List[MilestoneProgressOut]


# ── Routes ──────────────────────────────────────────────────────────────────

@router.get("/progress/{goal_id}", response_model=ProgressOut)
def get_goal_progress(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id, Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    progress = db.query(Progress).filter(Progress.goal_id == goal_id).first()
    if not progress:
        progress = Progress(
            goal_id=goal_id,
            streak_days=0,
            max_streak_days=0,
            missions_done=0,
            days_active=0,
            current_week=1,
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal_id).first()
    milestones: list[Milestone] = []
    total_milestones = 0
    completed_milestones = 0
    if roadmap:
        milestones = (
            db.query(Milestone)
            .filter(Milestone.roadmap_id == roadmap.id)
            .order_by(Milestone.week_number)
            .all()
        )
        total_milestones = len(milestones)
        completed_milestones = sum(1 for m in milestones if m.completed)

    total_missions = db.query(Mission).filter(Mission.goal_id == goal_id).count()
    completed_missions = db.query(Mission).filter(
        Mission.goal_id == goal_id, Mission.completed == True
    ).count()

    percent_complete = (
        int((completed_milestones / total_milestones) * 100) if total_milestones > 0 else 0
    )

    # Dynamic motivation
    if percent_complete == 0:
        line = "Every journey begins with a single step. Let's make today count!"
    elif percent_complete < 25:
        line = "Off to a strong start! Keep building that momentum."
    elif percent_complete < 50:
        line = "Almost halfway there! Consistency is your superpower."
    elif percent_complete < 75:
        line = "Halfway past! You are proving what you're capable of."
    elif percent_complete < 100:
        line = "So close to the finish line! Keep pushing, you've got this."
    else:
        line = "Amazing work! You've achieved your goal. Time to celebrate!"

    return ProgressOut(
        total_milestones=total_milestones,
        completed_milestones=completed_milestones,
        total_missions=total_missions,
        completed_missions=completed_missions,
        streak_days=progress.streak_days,
        missions_done=progress.missions_done,
        days_active=progress.days_active,
        current_week=progress.current_week,
        percent_complete=percent_complete,
        motivational_line=line,
        milestones=[
            MilestoneProgressOut(
                id=m.id,
                title=m.title,
                week_number=m.week_number,
                completed=m.completed,
                completed_at=m.completed_at,
            )
            for m in milestones
        ],
    )


@router.post("/milestones/{id}/complete", response_model=MilestoneProgressOut)
def toggle_milestone_completion(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    roadmap = db.query(Roadmap).filter(Roadmap.id == milestone.roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    goal = db.query(Goal).filter(
        Goal.id == roadmap.goal_id, Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=403, detail="Not authorized to update this milestone")

    milestone.completed = not milestone.completed
    milestone.completed_at = datetime.utcnow() if milestone.completed else None

    # Update current_week in progress
    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if progress:
        all_milestones = (
            db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id).all()
        )
        completed_weeks = [m.week_number for m in all_milestones if m.completed]
        if completed_weeks:
            progress.current_week = min(max(completed_weeks) + 1, len(all_milestones))
        else:
            progress.current_week = 1

    db.commit()
    db.refresh(milestone)

    return MilestoneProgressOut(
        id=milestone.id,
        title=milestone.title,
        week_number=milestone.week_number,
        completed=milestone.completed,
        completed_at=milestone.completed_at,
    )
