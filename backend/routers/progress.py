from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap, Milestone
from backend.models.progress import Progress
from backend.routers.auth import get_current_user
from backend.schemas.progress_schemas import ProgressResponse, MilestoneProgressResponse
from datetime import datetime

router = APIRouter(tags=["progress"])

@router.get("/progress/{goal_id}", response_model=ProgressResponse)
def get_goal_progress(goal_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Verify goal
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # 2. Fetch progress record
    progress = db.query(Progress).filter(Progress.goal_id == goal_id).first()
    if not progress:
        progress = Progress(
            goal_id=goal_id,
            streak_days=0,
            max_streak_days=0,
            missions_done=0,
            days_active=0,
            current_week=1
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # 3. Fetch milestones related to roadmap
    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal_id).first()
    milestones = []
    milestones_total = 0
    milestones_done = 0
    if roadmap:
        milestones = db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id).order_by(Milestone.week_number).all()
        milestones_total = len(milestones)
        milestones_done = sum(1 for m in milestones if m.completed)

    percent_complete = int((milestones_done / milestones_total) * 100) if milestones_total > 0 else 0

    # 4. Generate dynamic motivational line
    if percent_complete == 0:
        motivational_line = "Every journey begins with a single step. Let's make today count!"
    elif percent_complete < 25:
        motivational_line = "Off to a strong start! Keep building that momentum."
    elif percent_complete < 50:
        motivational_line = "Almost halfway there! Consistency is your superpower."
    elif percent_complete < 75:
        motivational_line = "Halfway past! You are proving what you're capable of."
    elif percent_complete < 100:
        motivational_line = "So close to the finish line! Keep pushing, you've got this."
    else:
        motivational_line = "Amazing work! You've achieved your goal. Time to celebrate!"

    # Format milestones response
    formatted_milestones = []
    for m in milestones:
        formatted_milestones.append(MilestoneProgressResponse(
            id=m.id,
            title=m.title,
            week_number=m.week_number,
            completed=m.completed,
            completed_at=m.completed_at
        ))

    return ProgressResponse(
        percent_complete=percent_complete,
        streak_days=progress.streak_days,
        missions_done=progress.missions_done,
        days_active=progress.days_active,
        current_week=progress.current_week,
        milestones=formatted_milestones,
        motivational_line=motivational_line
    )

@router.post("/milestones/{id}/complete", response_model=MilestoneProgressResponse)
def toggle_milestone_completion(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    roadmap = db.query(Roadmap).filter(Roadmap.id == milestone.roadmap_id).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
        
    goal = db.query(Goal).filter(Goal.id == roadmap.goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=403, detail="Not authorized to update this milestone")

    # Toggle completion status
    milestone.completed = not milestone.completed
    if milestone.completed:
        milestone.completed_at = datetime.utcnow()
    else:
        milestone.completed_at = None

    # Recalculate current_week in progress based on completed milestones
    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if progress:
        all_milestones = db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id).all()
        completed_weeks = [m.week_number for m in all_milestones if m.completed]
        
        if completed_weeks:
            max_completed = max(completed_weeks)
            total_weeks = len(all_milestones)
            progress.current_week = min(max_completed + 1, total_weeks)
        else:
            progress.current_week = 1

    db.commit()
    db.refresh(milestone)
    
    return MilestoneProgressResponse(
        id=milestone.id,
        title=milestone.title,
        week_number=milestone.week_number,
        completed=milestone.completed,
        completed_at=milestone.completed_at
    )
