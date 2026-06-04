import os
import json
import logging
from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)

# Initialize Anthropic client
api_key = os.getenv("ANTHROPIC_API_KEY", "")
client = None
if api_key:
    client = AsyncAnthropic(api_key=api_key)

# We use the model specified in the skill
MODEL = "claude-sonnet-4-20250514"

async def generate_roadmap(user_context: str, total_weeks: int) -> dict:
    prompt = f"""You are NAVIG, an expert AI goal execution coach.

{user_context}

Generate a structured weekly roadmap for this user's goal.
Return ONLY valid JSON with no extra text. Format:
{{
  "summary": "2 sentence overview of the plan",
  "weeks": [
    {{
      "week": 1,
      "milestone": "Short milestone title",
      "objectives": ["objective 1", "objective 2", "objective 3"],
      "daily_focus": "One sentence describing what to focus on daily this week"
    }}
  ]
}}

Rules:
- Generate exactly {total_weeks} weeks
- Each week has one milestone and two to four objectives
- Be completely specific to this user's experience level and available time
- Never give generic advice. Everything must reflect this exact user's situation.
- Objectives must be actionable, not vague"""

    if not client:
        logger.warning("ANTHROPIC_API_KEY not set. Using fallback mock roadmap.")
        return get_mock_roadmap(total_weeks)

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        content = response.content[0].text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error calling Claude for roadmap: {e}")
        return get_mock_roadmap(total_weeks)

async def generate_daily_mission(user_context: str, week_focus: str, today: str, minutes_per_day: int) -> dict:
    prompt = f"""You are NAVIG.

{user_context}

Current week focus: {week_focus}
Today is: {today}
Minutes available today: {minutes_per_day}

Return ONLY valid JSON:
{{
  "task": "Specific actionable task for today",
  "why": "One sentence on why this matters for their goal",
  "estimated_minutes": 45,
  "priority": "high"
}}

Rules:
- Task must be completable in one sitting
- Be specific. Not "study Python". Say "complete the FastAPI routing chapter and build one working GET endpoint with a test"
- Estimated minutes must not exceed the user's available daily time
- Priority is always high unless it is a review or reflection task"""

    if not client:
        logger.warning("ANTHROPIC_API_KEY not set. Using fallback mock daily mission.")
        return get_mock_mission(minutes_per_day)

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        content = response.content[0].text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error calling Claude for mission: {e}")
        return get_mock_mission(minutes_per_day)

async def ask_decision(user_context: str, question: str) -> str:
    prompt = f"""You are NAVIG, a personal AI advisor who knows this user deeply.

{user_context}

The user is asking: {question}

Answer as their personal advisor. Use their specific situation, timeline, budget, and current progress to answer. Do not give generic advice.
Be direct. Tell them exactly what to do and why.
Keep your answer under 150 words."""

    if not client:
        logger.warning("ANTHROPIC_API_KEY not set. Using fallback mock decision answer.")
        return f"Based on your profile, experience level, and available time, I suggest you focus on solidifying your foundations first. For this specific question, '{question}', prioritize setting up a simple testing suite to build confidence before scaling your code."

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return response.content[0].text.strip()
    except Exception as e:
        logger.error(f"Error calling Claude for decision: {e}")
        return f"I ran into an issue connecting to my core brain, but looking at your progress, I recommend you continue following the current week's objectives."

def get_mock_roadmap(total_weeks: int) -> dict:
    weeks = []
    for w in range(1, total_weeks + 1):
        weeks.append({
            "week": w,
            "milestone": f"Milestone for Week {w}",
            "objectives": [
                f"Objective {w}.1: Establish initial setup and configure core dependencies.",
                f"Objective {w}.2: Implement the primary interfaces and modules.",
                f"Objective {w}.3: Build integration tests and verify correctness."
            ],
            "daily_focus": f"Focus on core task execution for week {w} and ensure test coverage."
        })
    return {
        "summary": "This is a mock structured goal execution roadmap designed to guide you step-by-step to success.",
        "weeks": weeks
    }

def get_mock_mission(minutes_per_day: int) -> dict:
    return {
        "task": "Set up database connection configurations and initialize migrations.",
        "why": "This ensures your application database schema is properly configured before writing business routes.",
        "estimated_minutes": min(45, minutes_per_day),
        "priority": "high"
    }
