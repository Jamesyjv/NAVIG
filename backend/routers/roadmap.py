from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap, Milestone
from backend.models.progress import Progress
from backend.services.profile_builder import build_user_context
from backend.services.ai_service import generate_roadmap
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


# ── Response schemas ────────────────────────────────────────────────────────

class MilestoneOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    week_number: int
    completed: bool
    missions: List[dict] = []

    class Config:
        from_attributes = True


class RoadmapOut(BaseModel):
    id: str
    goal_title: str
    current_week: int
    total_weeks: int
    milestones: List[MilestoneOut]


# ── Routes ──────────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_user_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(
        Goal.user_id == current_user.id, Goal.status == "active"
    ).first()
    if not goal:
        raise HTTPException(
            status_code=404, detail="No active goal found. Please create one first."
        )

    # Return existing roadmap if already generated
    existing_roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal.id).first()
    if existing_roadmap:
        return {
            "roadmap_id": existing_roadmap.id,
            "raw_json": existing_roadmap.raw_json,
            "message": "Roadmap already exists.",
        }

    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if not progress:
        progress = Progress(goal_id=goal.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)

    milestones_total = goal.deadline_weeks if goal.deadline_weeks else 12

    user_context = build_user_context(
        user=current_user,
        goal=goal,
        progress=progress,
        milestones_done=0,
        milestones_total=milestones_total,
        percent_complete=0,
    )

    roadmap_data = await generate_roadmap(
        user_context=user_context, total_weeks=milestones_total
    )

    roadmap = Roadmap(goal_id=goal.id, raw_json=roadmap_data)
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    weeks = roadmap_data.get("weeks", [])
    for wk in weeks:
        # Pull description from the first objective if available
        objectives = wk.get("objectives", [])
        description = wk.get("daily_focus", objectives[0] if objectives else "")
        milestone = Milestone(
            roadmap_id=roadmap.id,
            title=wk.get("milestone", f"Milestone for Week {wk.get('week')}"),
            week_number=wk.get("week"),
            completed=False,
        )
        db.add(milestone)
    db.commit()

    return {"roadmap_id": roadmap.id, "raw_json": roadmap_data}


@router.get("/{goal_id}", response_model=RoadmapOut)
def get_user_roadmap(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id, Goal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not generated yet")

    milestones = (
        db.query(Milestone)
        .filter(Milestone.roadmap_id == roadmap.id)
        .order_by(Milestone.week_number)
        .all()
    )

    progress = db.query(Progress).filter(Progress.goal_id == goal_id).first()
    current_week = progress.current_week if progress else 1
    total_weeks = len(milestones) if milestones else (goal.deadline_weeks or 12)

    # Enrich milestones with description from raw_json
    raw_weeks: dict[int, dict] = {}
    for wk in roadmap.raw_json.get("weeks", []):
        raw_weeks[wk.get("week", 0)] = wk

    milestone_out = []
    for m in milestones:
        raw_wk = raw_weeks.get(m.week_number, {})
        objectives = raw_wk.get("objectives", [])
        description = raw_wk.get("daily_focus", "; ".join(objectives) if objectives else "")
        milestone_out.append(
            MilestoneOut(
                id=m.id,
                title=m.title,
                description=description,
                week_number=m.week_number,
                completed=m.completed,
                missions=[],  # missions per milestone are not stored individually yet
            )
        )

    return RoadmapOut(
        id=roadmap.id,
        goal_title=goal.title,
        current_week=current_week,
        total_weeks=total_weeks,
        milestones=milestone_out,
    )
