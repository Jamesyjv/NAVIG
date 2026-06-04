---
name: navig
description: >
  Build NAVIG — an AI-powered goal execution mobile app.
  Use this skill for every part of NAVIG: screens, components, backend routes,
  database schema, AI prompts, architecture decisions, and UI styling.
  Trigger on any request mentioning NAVIG screens, NAVIG backend, NAVIG design,
  NAVIG AI, NAVIG components, NAVIG database, or NAVIG features.
---

# NAVIG — Master Build Skill

## What is NAVIG

NAVIG is an AI-powered goal execution mobile app. It solves one problem:
people know what they want but don't know what to do next.

NAVIG fixes this by storing the user's goal, assessment answers, progress,
and past decisions in a database. Before every AI response, the full user
profile is injected into the prompt. The AI always responds as a personal
advisor who knows the user's entire journey — not a generic chatbot.

Core tagline: "The AI that always knows your next best step."

Core loop:
Goal → Assessment → Roadmap → Daily Mission → Progress → Decision Support


## The Problem NAVIG Solves

The internet has unlimited information. People still fail their goals because:
- They don't know what to do first
- They don't know what to do next
- They can't tell if they are making progress
- They make decisions without personal context

NAVIG replaces analysis paralysis with a single daily mission and a
context-aware AI that never forgets who you are.


## MVP Features — Phase 1 Only

Build only these six features. Nothing outside this scope.

1. Goal Creation
   User types their goal in plain language.
   Examples: "Become a backend developer", "Lose 15kg", "Start a business"
   Goal is saved to the database immediately.

2. User Assessment
   Four questions asked one at a time after goal creation.
   Q1: Current experience level — None / Beginner / Intermediate
   Q2: Hours available per week — slider from 1 to 20
   Q3: Budget — $0 / Under $50 / $50-200 / No limit
   Q4: Target deadline — 1 month / 3 months / 6 months / 1 year
   All answers stored in the user's goal profile in the database.

3. AI Roadmap Generator
   After assessment, AI generates a full roadmap using the user's profile.
   Roadmap contains: monthly milestones, weekly objectives, daily focus areas.
   Stored as structured JSON in PostgreSQL.
   Never regenerated unless user explicitly resets their goal.

4. Daily Mission
   One focused task per day, generated from the current week's roadmap focus.
   Shows: task description, estimated time, priority level, why it matters.
   User marks it complete. Completion is written back to the database.
   Streak counter increments on consecutive daily completions.

5. Progress Tracker
   Displays: goal completion percentage, current streak, milestones completed.
   Milestone list with toggle to mark each one done.
   Motivational line that updates dynamically based on percentage.

6. AI Decision Assistant
   User types any question related to their goal.
   AI answers using the full user profile as context — specific, not generic.
   Examples: "Should I learn Django or FastAPI first?"
              "Is 3 months realistic for me to get a job?"
   All questions and answers saved to decision history.


## Tech Stack

Mobile App:     React Native with Expo SDK 51 or later
Backend API:    Python 3.11 with FastAPI
Database:       PostgreSQL 15
AI Engine:      Anthropic Claude API — model claude-sonnet-4-20250514
Authentication: JWT tokens using python-jose library + OAuth2 password flow
Push Alerts:    Expo Push Notifications with Firebase Cloud Messaging
State Mgmt:     Zustand (frontend)
HTTP Client:    Axios with typed endpoints (frontend)
Hosting MVP:    Railway for both backend and database
Env Config:     python-dotenv for backend, Expo env for frontend


## App Architecture

The app has three layers.

Layer 1 — Mobile (React Native / Expo)
Handles all UI, user interactions, and local state.
Communicates with the backend via REST API only.
No AI calls happen from the frontend. All AI is on the backend.
Uses Zustand to store the current user session and active goal.

Layer 2 — Backend API (FastAPI)
Receives requests from the mobile app.
Fetches the user's full profile from PostgreSQL.
Builds a structured context string from the profile.
Injects that context into the Claude API prompt.
Returns the AI response to the mobile app.
Writes any completion events back to the database.

Layer 3 — Database (PostgreSQL)
Stores everything persistently: users, goals, assessments, roadmaps,
milestones, daily missions, and decision history.
This is the memory of NAVIG. Every AI call depends on data from here.

AI Memory Flow (how it works technically):
Step 1 — User's goal + assessment + progress is stored in PostgreSQL.
Step 2 — Before every Claude API call, the backend fetches this data.
Step 3 — A profile_builder function converts it to a structured text block.
Step 4 — That text block is prepended to every prompt as USER PROFILE.
Step 5 — Claude responds with full context of who this user is.
Step 6 — After the response, completion events are written back to the DB.
Step 7 — The profile grows smarter with every interaction.


## Code Architecture

navig/
├── app/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Onboarding/
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── GoalCreationScreen.tsx
│   │   │   │   └── AssessmentScreen.tsx
│   │   │   ├── Home/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   └── RoadmapScreen.tsx
│   │   │   ├── Progress/
│   │   │   │   └── ProgressScreen.tsx
│   │   │   └── Decision/
│   │   │       └── DecisionScreen.tsx
│   │   ├── components/
│   │   │   ├── PrimaryButton.tsx
│   │   │   ├── MissionCard.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── MilestoneRow.tsx
│   │   │   ├── AssessmentCard.tsx
│   │   │   └── DecisionBubble.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── store/
│   │   │   └── userStore.ts
│   │   └── theme/
│   │       ├── colors.ts
│   │       ├── typography.ts
│   │       └── spacing.ts
│   └── app.json
│
└── backend/
    ├── main.py
    ├── routers/
    │   ├── auth.py
    │   ├── goals.py
    │   ├── roadmap.py
    │   ├── missions.py
    │   ├── progress.py
    │   └── decision.py
    ├── models/
    │   ├── user.py
    │   ├── goal.py
    │   ├── roadmap.py
    │   └── mission.py
    ├── services/
    │   ├── ai_service.py
    │   └── profile_builder.py
    ├── schemas/
    │   ├── goal_schemas.py
    │   ├── mission_schemas.py
    │   └── decision_schemas.py
    ├── database.py
    └── config.py


## Database Schema

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  experience_level TEXT,
  hours_per_week INT,
  budget_usd INT,
  deadline_weeks INT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  raw_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  week_number INT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  why TEXT,
  estimated_minutes INT,
  priority TEXT DEFAULT 'high',
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  ai_answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


## API Routes

POST   /auth/register
POST   /auth/login
GET    /auth/me

POST   /goals/
GET    /goals/active
GET    /goals/{goal_id}

POST   /roadmap/generate
GET    /roadmap/{goal_id}

GET    /missions/today
POST   /missions/{id}/complete

GET    /progress/{goal_id}
POST   /milestones/{id}/complete

POST   /decision/ask
GET    /decision/history


## AI Prompts

Profile Builder — runs before every AI call:

def build_user_context(user, goal, progress):
    return f"""
USER PROFILE:
Name: {user.name}
Goal: {goal.title}
Category: {goal.category}
Experience level: {goal.experience_level}
Available time: {goal.hours_per_week} hours per week
Budget: ${goal.budget_usd}
Deadline: {goal.deadline_weeks} weeks from start
Current week: {progress.current_week}
Milestones completed: {progress.milestones_done} of {progress.milestones_total}
Current streak: {progress.streak_days} days
Overall progress: {progress.percent_complete}%
"""

Roadmap Generation Prompt:

You are NAVIG, an expert AI goal execution coach.

{user_context}

Generate a structured weekly roadmap for this user's goal.
Return ONLY valid JSON with no extra text. Format:
{
  "summary": "2 sentence overview of the plan",
  "weeks": [
    {
      "week": 1,
      "milestone": "Short milestone title",
      "objectives": ["objective 1", "objective 2", "objective 3"],
      "daily_focus": "One sentence describing what to focus on daily this week"
    }
  ]
}

Rules:
- Generate exactly {total_weeks} weeks
- Each week has one milestone and two to four objectives
- Be completely specific to this user's experience level and available time
- Never give generic advice. Everything must reflect this exact user's situation.
- Objectives must be actionable, not vague

Daily Mission Prompt:

You are NAVIG.

{user_context}

Current week focus: {week_focus}
Today is: {today}
Minutes available today: {minutes_per_day}

Return ONLY valid JSON:
{
  "task": "Specific actionable task for today",
  "why": "One sentence on why this matters for their goal",
  "estimated_minutes": 45,
  "priority": "high"
}

Rules:
- Task must be completable in one sitting
- Be specific. Not "study Python". Say "complete the FastAPI routing chapter
  and build one working GET endpoint with a test"
- Estimated minutes must not exceed the user's available daily time
- Priority is always high unless it is a review or reflection task

Decision Assistant Prompt:

You are NAVIG, a personal AI advisor who knows this user deeply.

{user_context}

The user is asking: {question}

Answer as their personal advisor. Use their specific situation, timeline,
budget, and current progress to answer. Do not give generic advice.
Be direct. Tell them exactly what to do and why.
Keep your answer under 150 words.


## Design System

Font: DM Sans — weights 400 (body), 500 (labels), 600 (headings), 700 (hero numbers only)
Load via expo-google-fonts

Colors:
BACKGROUND    #080C14   Deep black-navy. Every screen background.
CARD          #0F1923   Card and input surfaces. Slight lift from background.
BORDER        #1A2D42   All card borders and dividers. Subtle, not visible.
ACCENT        #00D4FF   Electric cyan. Primary brand. One use: CTA button, progress ring, active nav icon.
SUCCESS       #00FFC2   Mint green. Streak count, completed states, milestone done.
TEXT_PRIMARY  #F0F4F8   Slightly warm white. All primary text.
TEXT_MUTED    #4A6580   Secondary text, labels, placeholders.
WARNING       #F4A261   Amber. Overdue missions only.
ERROR         #D94F3D   Red. Form validation errors only.

Spacing — use only these values:
XS  4px
SM  8px
MD  16px
LG  24px
XL  32px
XXL 48px

Border radius:
Buttons   12px
Cards     16px
Inputs    10px
Badges    20px

Elevation:
Cards     elevation 2, shadowColor #000, shadowOpacity 0.2
No other shadows anywhere

Rules:
- Dark mode only. No light mode in MVP.
- No gradients anywhere.
- ACCENT color (#00D4FF) used on exactly three elements: primary CTA button,
  progress ring fill, active bottom nav icon. Nowhere else.
- SUCCESS color (#00FFC2) used only for streaks, completed states, done badges.
- All other UI elements use BACKGROUND, CARD, BORDER, and text colors only.
- Every screen has the same BACKGROUND color. No screen-level color variation.


## Screen Specifications

HomeScreen — Daily Mission
- Header: "Good morning, {name}" in TEXT_MUTED, 16px
- Date line below header in TEXT_MUTED, 13px
- Active goal shown as a small pill chip in ACCENT color at 10% opacity with ACCENT text
- MissionCard centered and prominent — this is the main element
- MissionCard shows: task text (18px, 600 weight, TEXT_PRIMARY),
  estimated time badge, priority badge, why text (14px, TEXT_MUTED),
  Complete button (ACCENT filled, full width, inside card at bottom)
- On complete: card border becomes SUCCESS, checkmark animation plays
- Streak row below card: flame icon + "{n} day streak" in SUCCESS, 14px
- Two small text links at bottom: "View Roadmap" and "See Progress"

GoalCreationScreen
- Full screen, vertically centered
- Large input field, placeholder: "What do you want to achieve?"
  Input bg CARD, border BORDER, text TEXT_PRIMARY, placeholder TEXT_MUTED, radius 10
- Tappable example chips below input:
  "Become a backend developer", "Lose 15kg", "Start an online business",
  "Learn a new language"
  Chips: CARD bg, BORDER border, TEXT_MUTED text, radius 20
  On tap: fills the input with that text
- Primary CTA button at bottom: "Set this goal" in ACCENT filled style

AssessmentScreen
- Progress bar at top showing 1 of 4, 2 of 4, etc. Bar fill in ACCENT
- One question per screen, large text center aligned, 22px, 600 weight
- Answer options displayed as full-width tappable cards
  Default: CARD bg, BORDER border
  Selected: CARD bg, ACCENT border at 1.5px, ACCENT bg at 8% opacity
- "Continue" button at bottom, only active when an answer is selected

RoadmapScreen
- Header: goal title as page title
- Summary text block from AI (14px, TEXT_MUTED, italic)
- Week list below: each week as a row
  Week number label (ACCENT, 12px), milestone title (TEXT_PRIMARY, 15px, 500 weight)
  Expand arrow to show objectives for that week
  Completed weeks show SUCCESS checkmark

ProgressScreen
- ProgressRing centered at top: 120px, ACCENT stroke, BORDER track, percentage in center
  Below ring: "{percent}% complete" in TEXT_MUTED
- Stats row: three equal boxes showing streak days / missions done / days active
  Each box: CARD bg, BORDER border, number in 22px 600 TEXT_PRIMARY, label in TEXT_MUTED
- Milestones section below with a row per milestone
  Each row: week number (TEXT_MUTED), title (TEXT_PRIMARY), toggle right side
  Completed: toggle shows SUCCESS color
- Motivational line at bottom in ACCENT, 14px, centered

DecisionScreen
- Decision history list at top (scrollable): each item is a card with question
  and AI answer, mint left border on the card
- Sticky input bar at very bottom of screen
  Input bg CARD, placeholder "Ask NAVIG anything about your goal..."
  Send button right side, ACCENT icon
- AI response appears as new card at top of list after submission
- Loading state: three pulsing dots in ACCENT color


## Component Specifications

PrimaryButton
- filled variant: bg ACCENT, text #080C14 (dark text on cyan), radius 12, height 52
- outline variant: bg transparent, border 1.5px ACCENT, text ACCENT, radius 12, height 52
- disabled: opacity 0.38 on either variant
- font: 15px, weight 600

MissionCard
- bg CARD, border BORDER at 0.5px, radius 16, padding MD
- Task text: 18px, weight 600, TEXT_PRIMARY
- Time badge and priority badge on same row below task text
  Badge: BORDER bg, TEXT_MUTED text, radius 20, 11px font
- Why text: 13px, TEXT_MUTED, italic, margin top SM
- Divider line in BORDER color
- Complete button: full width inside card, ACCENT filled, "Mark Complete"
- On complete: card border switches to SUCCESS color

ProgressRing
- Outer track: BORDER color (#1A2D42)
- Fill stroke: ACCENT color (#00D4FF)
- Stroke width: 8px
- Size: 120px default, 80px small variant
- Center text: percentage in 28px 700 weight TEXT_PRIMARY
- Below center: "complete" label in 12px TEXT_MUTED

MilestoneRow
- Full width row, padding SM vertical MD horizontal
- Left: week number in ACCENT, 12px, 500 weight
- Center: milestone title in TEXT_PRIMARY, 14px
- Right: completion toggle — incomplete is BORDER circle, complete is SUCCESS circle with check
- Bottom border in BORDER color as divider

AssessmentCard (answer option)
- Full width, CARD bg, BORDER border, radius 12, padding MD
- Label text in TEXT_PRIMARY, 15px, 500 weight
- Selected state: border color switches to ACCENT, bg becomes ACCENT at 8% opacity
- Tap animation: slight scale down 0.97 on press

DecisionBubble (AI answer card)
- CARD bg, 2px left border in SUCCESS color, radius 12, padding MD
- Question text: 13px, TEXT_MUTED, above answer
- Answer text: 14px, TEXT_PRIMARY, line height 1.6
- Timestamp: 11px, TEXT_MUTED, bottom right


## Important Rules for Building

1. All AI logic lives in backend/services/ai_service.py only.
   Never call the Claude API from the frontend.

2. Every Claude API call must include the full user context from profile_builder.
   No AI response without context injection. This is the core product.

3. All colors come from theme/colors.ts only.
   Never hardcode hex values in component files.

4. Spacing comes from theme/spacing.ts only.
   Never hardcode pixel values outside the spacing scale.

5. ACCENT (#00D4FF) appears on exactly three UI elements total.
   Primary CTA button. Progress ring fill. Active bottom nav icon.
   If you are about to use ACCENT anywhere else, stop and use TEXT_PRIMARY or SUCCESS instead.

6. MVP scope is six features. If a feature is not in the MVP list, do not build it.
   No mentor marketplace, no community, no notifications, no settings screen in MVP.

7. Every database write happens on the backend, never from the frontend directly.

8. The roadmap JSON is generated once and stored. It is not regenerated on each visit.
   Fetch from the database on subsequent loads.

9. Bottom navigation has four tabs only: Home, Roadmap, Progress, Decision.
   Icons must be from @expo/vector-icons Feather set.

10. No animations except: mission complete card border transition,
    assessment card press scale, and decision loading dots.
    Keep the UI fast and minimal.
