from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap, Milestone
from backend.models.progress import Progress
from backend.services.profile_builder import build_user_context
from backend.services.ai_service import generate_roadmap
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

@router.post("/generate")
async def generate_user_roadmap(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Fetch active goal
    goal = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "active").first()
    if not goal:
        raise HTTPException(status_code=404, detail="No active goal found. Please create one first.")
        
    # Check if a roadmap already exists
    existing_roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal.id).first()
    if existing_roadmap:
        return {"roadmap_id": existing_roadmap.id, "raw_json": existing_roadmap.raw_json, "message": "Roadmap already exists."}

    # 2. Fetch progress
    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if not progress:
        progress = Progress(goal_id=goal.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # 3. Calculate milestones count (default to 4 or deadline)
    # The assessment sets deadline_weeks to e.g. 4, 12, 24, 48. Let's fallback to 12.
    milestones_total = goal.deadline_weeks if goal.deadline_weeks else 12

    # 4. Build context
    user_context = build_user_context(
        user=current_user,
        goal=goal,
        progress=progress,
        milestones_done=0,
        milestones_total=milestones_total,
        percent_complete=0
    )

    # 5. Call Claude
    roadmap_data = await generate_roadmap(user_context=user_context, total_weeks=milestones_total)

    # 6. Save Roadmap to DB
    roadmap = Roadmap(
        goal_id=goal.id,
        raw_json=roadmap_data
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    # 7. Parse weeks & populate Milestones table
    weeks = roadmap_data.get("weeks", [])
    for wk in weeks:
        milestone = Milestone(
            roadmap_id=roadmap.id,
            title=wk.get("milestone", f"Milestone for Week {wk.get('week')}"),
            week_number=wk.get("week"),
            completed=False
        )
        db.add(milestone)
    db.commit()

    return {"roadmap_id": roadmap.id, "raw_json": roadmap_data}

@router.get("/{goal_id}")
def get_user_roadmap(goal_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not generated yet")

    return roadmap
