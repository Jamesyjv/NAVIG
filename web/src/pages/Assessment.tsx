import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { goalsAPI, roadmapAPI } from '../api/client'
import { useAuth } from '../store/auth'

type Level = 'beginner' | 'intermediate' | 'expert'

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'beginner',     label: 'Beginner',     desc: "I'm just getting started" },
  { value: 'intermediate', label: 'Intermediate',  desc: 'I have some experience' },
  { value: 'expert',       label: 'Expert',        desc: 'I have deep expertise' },
]
const HOURS_OPTIONS = [2, 5, 10, 20, 40]
const WEEK_OPTIONS  = [4, 8, 12, 24, 52]

export default function Assessment() {
  const [step, setStep]       = useState(0)
  const [level, setLevel]     = useState<Level>('beginner')
  const [hours, setHours]     = useState(10)
  const [budget, setBudget]   = useState('')
  const [weeks, setWeeks]     = useState(12)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { updateActiveGoal }  = useAuth()
  const navigate = useNavigate()

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
      setError(e?.response?.data?.detail ?? 'Failed to generate roadmap.')
      setLoading(false)
    }
  }

  const stepDots = [
    { id: 'done' as const },   // goal (already done)
    { id: step >= 1 ? 'done' as const : 'active' as const },
    { id: step >= 2 ? 'done' as const : step === 1 ? 'active' as const : '' as const },
  ]

  return (
    <div className="onboarding animate-in">
      {/* Step dots */}
      <div className="row gap6">
        {stepDots.map((d, i) => (
          <div key={i} className={`step-dot ${d.id}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="col gap20 animate-in">
          <div className="col gap8">
            <p className="t-overline">Step 2 — Experience</p>
            <h2 className="t-title">How familiar are you<br />with this area?</h2>
          </div>

          <div className="col gap8">
            {LEVELS.map(l => (
              <button
                key={l.value}
                type="button"
                onClick={() => setLevel(l.value)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: level === l.value ? 'var(--accent-faint)' : 'var(--surface)',
                  border: `1px solid ${level === l.value ? 'rgba(0,212,255,0.3)' : 'var(--line)'}`,
                  borderRadius: 'var(--r2)',
                  cursor: 'pointer',
                  transition: 'all 0.14s',
                  textAlign: 'left',
                  width: '100%',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15, color: level === l.value ? 'var(--accent)' : 'var(--t1)' }}>
                    {l.label}
                  </p>
                  <p className="t-sm t-muted" style={{ marginTop: 2 }}>{l.desc}</p>
                </div>
                {level === l.value && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => setStep(1)}>Continue</button>
          <button className="btn btn-ghost" onClick={() => navigate('/goal')}>Back</button>
        </div>
      )}

      {step === 1 && (
        <div className="col gap20 animate-in">
          <div className="col gap8">
            <p className="t-overline">Step 2 — Commitment</p>
            <h2 className="t-title">How many hours can<br />you commit each week?</h2>
          </div>

          <div className="row wrap gap8">
            {HOURS_OPTIONS.map(h => (
              <button
                key={h}
                type="button"
                className={`chip${hours === h ? ' selected' : ''}`}
                style={{ fontSize: 14, padding: '10px 18px' }}
                onClick={() => setHours(h)}
              >
                {h} hrs
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => setStep(2)}>Continue</button>
          <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
        </div>
      )}

      {step === 2 && (
        <div className="col gap20 animate-in">
          <div className="col gap8">
            <p className="t-overline">Step 3 — Timeline</p>
            <h2 className="t-title">When do you want<br />to reach your goal?</h2>
          </div>

          <div className="col gap10">
            <p className="input-label">Target deadline</p>
            <div className="row wrap gap8">
              {WEEK_OPTIONS.map(w => (
                <button
                  key={w}
                  type="button"
                  className={`chip${weeks === w ? ' selected' : ''}`}
                  style={{ fontSize: 14, padding: '10px 16px' }}
                  onClick={() => setWeeks(w)}
                >
                  {w < 52 ? `${w} weeks` : '1 year'}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <p className="input-label">Budget (optional)</p>
            <input
              className="input"
              type="number"
              placeholder="USD — leave blank if none"
              min="0"
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--danger)', lineHeight: 1.4 }}>{error}</p>
          )}

          <div style={{ flex: 1 }} />

          <button className="btn btn-primary" onClick={finish} disabled={loading}>
            {loading
              ? <><span className="spinner" />&nbsp;Generating roadmap…</>
              : 'Generate my roadmap'}
          </button>
          <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>Back</button>
        </div>
      )}
    </div>
  )
}
