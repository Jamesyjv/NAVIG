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
      const goal = res.data
      if (category) await goalsAPI.updateActive({ category })
      setActiveGoal(goal)
      navigate('/assessment', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail ?? 'Failed to create goal. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="onboarding page-enter">
      <div className="col gap4">
        <p className="text-xs text-accent upper">Step 1 of 3</p>
        <h2 className="text-title">What's your big goal?</h2>
        <p className="text-sm text-muted">Be specific — the clearer it is, the better your AI roadmap.</p>
      </div>

      <form className="col gap16" onSubmit={handleSubmit} style={{ flex: 1 }}>
        <textarea
          className="input"
          placeholder="e.g. Become a full-stack developer in 6 months"
          rows={3}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ paddingTop: 14, paddingBottom: 14 }}
        />

        <div className="col gap8">
          <p className="text-sm text-muted">Category (optional)</p>
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

        {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" type="submit" disabled={loading || !title.trim()}>
          {loading ? <span className="spinner" /> : 'Continue →'}
        </button>
      </form>
    </div>
  )
}
