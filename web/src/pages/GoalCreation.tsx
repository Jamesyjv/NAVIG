import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { goalsAPI } from '../api/client'
import { useAuth } from '../store/auth'

const CATEGORIES = ['Career', 'Education', 'Health', 'Finance', 'Creative', 'Business', 'Personal', 'Other']

export default function GoalCreation() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setActiveGoal } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError('')
    try {
      const res = await goalsAPI.create(title.trim())
      if (category) await goalsAPI.updateActive({ category })
      setActiveGoal(res.data)
      navigate('/assessment', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div className="onboarding animate-in">
      {/* Step indicator */}
      <div className="row gap6">
        <div className="step-dot active" />
        <div className="step-dot" />
        <div className="step-dot" />
      </div>

      {/* Header */}
      <div className="col gap8">
        <p className="t-overline">Step 1 — Your goal</p>
        <h2 className="t-title" style={{ lineHeight: 1.2 }}>What are you<br />working towards?</h2>
        <p className="t-sm t-muted" style={{ lineHeight: 1.55, marginTop: 4 }}>
          Be specific. The more context you give, the more accurate your roadmap will be.
        </p>
      </div>

      <form className="col gap20" onSubmit={handleSubmit} style={{ flex: 1 }}>
        <textarea
          className="input"
          rows={4}
          placeholder="e.g. Get a job as a backend engineer at a product company within 6 months"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ paddingTop: 14, paddingBottom: 14 }}
        />

        <div className="col gap10">
          <p className="input-label">Category</p>
          <div className="row wrap gap8">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                className={`chip${category === c ? ' selected' : ''}`}
                onClick={() => setCategory(prev => prev === c ? '' : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
        )}

        <div style={{ flex: 1 }} />

        <button className="btn btn-primary" type="submit" disabled={loading || !title.trim()}>
          {loading ? <span className="spinner" /> : 'Continue'}
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  )
}
