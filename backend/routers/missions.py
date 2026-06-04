from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.roadmap import Roadmap
from backend.models.mission import Mission
from backend.models.progress import Progress
from backend.models.roadmap import Milestone
from backend.services.profile_builder import build_user_context
from backend.services.ai_service import generate_daily_mission
from backend.routers.auth import get_current_user
from backend.schemas.mission_schemas import MissionResponse

router = APIRouter(prefix="/missions", tags=["missions"])

@router.get("/today", response_model=MissionResponse)
async def get_today_mission(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Fetch active goal
    goal = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "active").first()
    if not goal:
        raise HTTPException(status_code=404, detail="No active goal found")

    today_date = date.today()

    # 2. Check if today's mission is already generated
    mission = db.query(Mission).filter(Mission.goal_id == goal.id, Mission.date == today_date).first()
    if mission:
        return mission

    # 3. Fetch roadmap and progress
    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal.id).first()
    if not roadmap:
        raise HTTPException(status_code=400, detail="Roadmap must be generated first")

    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if not progress:
        progress = Progress(goal_id=goal.id)
        db.add(progress)
        db.commit()
        db.refresh(progress)

    # 4. Extract current week daily focus from roadmap JSON
    current_wk = progress.current_week
    weeks = roadmap.raw_json.get("weeks", [])
    week_focus = "Focus on goals and build consistency."
    for wk in weeks:
        if wk.get("week") == current_wk:
            week_focus = wk.get("daily_focus", week_focus)
            break

    # Calculate daily minutes based on hours per week
    hours_per_week = goal.hours_per_week or 7
    minutes_per_day = int((hours_per_week * 60) / 7)

    # Fetch stats for profile builder
    milestones_total = db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id).count()
    milestones_done = db.query(Milestone).filter(Milestone.roadmap_id == roadmap.id, Milestone.completed == True).count()
    percent_complete = int((milestones_done / milestones_total) * 100) if milestones_total > 0 else 0

    user_context = build_user_context(
        user=current_user,
        goal=goal,
        progress=progress,
        milestones_done=milestones_done,
        milestones_total=milestones_total,
        percent_complete=percent_complete
    )

    # 5. Call Claude
    mission_data = await generate_daily_mission(
        user_context=user_context,
        week_focus=week_focus,
        today=today_date.strftime("%A, %B %d, %Y"),
        minutes_per_day=minutes_per_day
    )

    # 6. Save new mission to DB
    mission = Mission(
        goal_id=goal.id,
        task=mission_data.get("task", "Core goal practice"),
        why=mission_data.get("why", "Build consistency towards your target"),
        estimated_minutes=mission_data.get("estimated_minutes", 30),
        priority=mission_data.get("priority", "high"),
        date=today_date,
        completed=False
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)

    return mission

@router.post("/{id}/complete", response_model=MissionResponse)
def complete_mission(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch mission and verify goal ownership
    mission = db.query(Mission).filter(Mission.id == id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    goal = db.query(Goal).filter(Goal.id == mission.goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=403, detail="Not authorized to update this mission")

    if mission.completed:
        return mission

    # Mark completed
    mission.completed = True
    mission.completed_at = datetime.utcnow()

    # Update Progress stats
    progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if not progress:
        progress = Progress(goal_id=goal.id)
        db.add(progress)

    progress.missions_done += 1

    today_date = date.today()
    if progress.last_activity_date:
        # Check if last completed was yesterday (streak continues)
        yesterday = today_date - timedelta(days=1)
        if progress.last_activity_date == yesterday:
            progress.streak_days += 1
        # If last completed was today (already done a mission today), streak is unchanged
        elif progress.last_activity_date == today_date:
            pass
        # Broken streak
        else:
            progress.streak_days = 1
    else:
        # First completion
        progress.streak_days = 1

    # Update max streak
    if progress.streak_days > progress.max_streak_days:
        progress.max_streak_days = progress.streak_days

    # Update active days
    if progress.last_activity_date != today_date:
        progress.days_active += 1

    progress.last_activity_date = today_date

    db.commit()
    db.refresh(mission)
    return mission
