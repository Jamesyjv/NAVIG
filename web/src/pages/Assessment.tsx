import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { goalsAPI, roadmapAPI } from '../api/client'
import { useAuth } from '../store/auth'

type Level = 'beginner' | 'intermediate' | 'expert'

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting out' },
  { value: 'intermediate', label: '⚡ Intermediate', desc: 'Some experience' },
  { value: 'expert', label: '🔥 Expert', desc: 'Deep background' },
]
const HOURS = [2, 5, 10, 20, 40]
const WEEKS = [4, 8, 12, 24, 52]

interface StepProps { onNext: () => void; onBack: () => void }

export default function Assessment() {
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState<Level>('beginner')
  const [hours, setHours] = useState(10)
  const [budget, setBudget] = useState('')
  const [weeks, setWeeks] = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { updateActiveGoal } = useAuth()
  const navigate = useNavigate()

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const finish = async () => {
    setLoading(true); setError('')
    try {
      const patch = {
        experience_level: level,
        hours_per_week: hours,
        deadline_weeks: weeks,
        ...(budget ? { budget_usd: parseFloat(budget) } : {}),
      }
      await goalsAPI.updateActive(patch)
      updateActiveGoal(patch)
      await roadmapAPI.generate()
      navigate('/home', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail ?? 'Failed to generate roadmap. Try again.')
      setLoading(false)
    }
  }

  const STEPS = [
    // Step 0: Experience
    <div className="col gap16 page-enter" key="level">
      <div className="col gap4">
        <p className="text-xs text-accent upper">Step 2 of 3 · Assessment</p>
        <h2 className="text-title">What's your experience level?</h2>
      </div>
      <div className="col gap10" style={{ gap: 10 }}>
        {LEVELS.map(l => (
          <button
            key={l.value}
            type="button"
            onClick={() => setLevel(l.value)}
            className="card card-sm row between"
            style={{
              cursor: 'pointer', border: `1px solid ${level === l.value ? 'var(--accent)' : 'var(--border)'}`,
              background: level === l.value ? 'var(--accent-dim)' : 'var(--card)',
              textAlign: 'left', width: '100%',
            }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{l.label}</p>
              <p className="text-sm text-muted" style={{ marginTop: 2 }}>{l.desc}</p>
            </div>
            {level === l.value && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        ))}
      </div>
      <StepButtons onBack={() => navigate('/goal')} onNext={next} />
    </div>,

    // Step 1: Hours
    <div className="col gap16 page-enter" key="hours">
      <div className="col gap4">
        <p className="text-xs text-accent upper">Step 2 of 3 · Assessment</p>
        <h2 className="text-title">Hours per week?</h2>
        <p className="text-sm text-muted">How much time can you commit?</p>
      </div>
      <div className="row wrap gap8">
        {HOURS.map(h => (
          <button
            key={h}
            type="button"
            className={`chip${hours === h ? ' selected' : ''}`}
            style={{ fontSize: 14, padding: '10px 20px' }}
            onClick={() => setHours(h)}
          >
            {h}h
          </button>
        ))}
      </div>
      <StepButtons onBack={back} onNext={next} />
    </div>,

    // Step 2: Budget + Timeline
    <div className="col gap16 page-enter" key="budget">
      <div className="col gap4">
        <p className="text-xs text-accent upper">Step 3 of 3 · Assessment</p>
        <h2 className="text-title">Timeline & budget</h2>
      </div>

      <div className="col gap8">
        <label className="text-sm text-muted">Goal deadline (weeks)</label>
        <div className="row wrap gap8">
          {WEEKS.map(w => (
            <button
              key={w}
              type="button"
              className={`chip${weeks === w ? ' selected' : ''}`}
              style={{ fontSize: 14, padding: '10px 16px' }}
              onClick={() => setWeeks(w)}
            >
              {w}w
            </button>
          ))}
        </div>
      </div>

      <div className="col gap8">
        <label className="text-sm text-muted">Budget in USD (optional)</label>
        <input
          className="input"
          type="number"
          placeholder="e.g. 500"
          min="0"
          value={budget}
          onChange={e => setBudget(e.target.value)}
        />
      </div>

      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}

      <button className="btn btn-primary" onClick={finish} disabled={loading} style={{ marginTop: 8 }}>
        {loading
          ? <><span className="spinner" /> Generating roadmap…</>
          : '🚀 Generate My Roadmap'}
      </button>
      <button className="btn btn-outline" onClick={back}>← Back</button>
    </div>,
  ]

  return (
    <div className="onboarding">
      {/* Step dots */}
      <div className="step-dots">
        {STEPS.map((_, i) => (
          <div key={i} className={`step-dot${i === step ? ' active' : ''}`} />
        ))}
      </div>
      {STEPS[step]}
    </div>
  )
}

function StepButtons({ onBack, onNext }: StepProps) {
  return (
    <div className="col gap8" style={{ marginTop: 'auto' }}>
      <button className="btn btn-primary" onClick={onNext}>Continue →</button>
      <button className="btn btn-outline" onClick={onBack}>← Back</button>
    </div>
  )
}
