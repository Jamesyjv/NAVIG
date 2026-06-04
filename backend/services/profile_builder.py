def build_user_context(user, goal, progress, milestones_done: int = 0, milestones_total: int = 0, percent_complete: int = 0):
    return f"""USER PROFILE:
Name: {user.name}
Goal: {goal.title}
Category: {goal.category or 'Not Specified'}
Experience level: {goal.experience_level or 'Not Specified'}
Available time: {goal.hours_per_week or 0} hours per week
Budget: ${goal.budget_usd or 0}
Deadline: {goal.deadline_weeks or 0} weeks from start
Current week: {progress.current_week if progress else 1}
Milestones completed: {milestones_done} of {milestones_total}
Current streak: {progress.streak_days if progress else 0} days
Overall progress: {percent_complete}%
"""
