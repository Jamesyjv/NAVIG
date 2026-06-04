from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User
from backend.models.goal import Goal
from backend.models.progress import Progress
from backend.schemas.goal_schemas import GoalCreate, GoalResponse, GoalUpdate
from backend.routers.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["goals"])

@router.post("/", response_model=GoalResponse)
def create_goal(goal_in: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Deactivate existing active goals for this user
    db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "active").update({"status": "inactive"})
    
    # Create the new goal
    goal = Goal(
        user_id=current_user.id,
        title=goal_in.title,
        status="active"
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    # Create the default progress record for this goal
    # Check if a progress already exists (shouldn't, but just in case)
    existing_progress = db.query(Progress).filter(Progress.goal_id == goal.id).first()
    if not existing_progress:
        progress = Progress(
            goal_id=goal.id,
            current_week=1,
            streak_days=0,
            max_streak_days=0,
            missions_done=0,
            days_active=0
        )
        db.add(progress)
        db.commit()
    
    return goal

@router.get("/active", response_model=GoalResponse)
def get_active_goal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "active").first()
    if not goal:
        raise HTTPException(status_code=404, detail="No active goal found")
    return goal

@router.put("/active", response_model=GoalResponse)
def update_active_goal(goal_update: GoalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.user_id == current_user.id, Goal.status == "active").first()
    if not goal:
        raise HTTPException(status_code=404, detail="No active goal found")
    
    # Update category, experience_level, hours_per_week, budget_usd, deadline_weeks
    for key, value in goal_update.dict(exclude_unset=True).items():
        setattr(goal, key, value)
    
    db.commit()
    db.refresh(goal)
    return goal

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal
