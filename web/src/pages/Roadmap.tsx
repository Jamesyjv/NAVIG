import { useState, useEffect, useCallback } from 'react'
import { roadmapAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Milestone {
  id: string; title: string; description: string | null
  week_number: number; status: string; completed: boolean
}
interface RoadmapData { milestones: Milestone[]; goal_title: string }

export default function Roadmap() {
  const { activeGoal } = useAuth()
  const [data, setData] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!activeGoal) { setLoading(false); return }
    try {
      const res = await roadmapAPI.get(activeGoal.id)
      setData(res.data)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [activeGoal])

  useEffect(() => { fetch() }, [fetch])

  if (!activeGoal) return (
    <div className="page page-enter">
      <div className="page-inner">
        <div className="empty-state">
          <span className="empty-emoji">🗺️</span>
          <p style={{ fontWeight: 700, fontSize: 18 }}>No active goal</p>
          <p className="text-sm text-muted">Create a goal first to see your roadmap.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page page-enter">
      <div className="page-inner">
        <div className="col gap4">
          <p className="text-xs text-accent upper">Your Roadmap</p>
          <p style={{ fontWeight: 700, fontSize: 22 }}>{data?.goal_title ?? activeGoal.title}</p>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : !data || data.milestones.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🗺️</span>
            <p style={{ fontWeight: 700, fontSize: 18 }}>Roadmap not generated yet</p>
            <p className="text-sm text-muted">Complete the assessment to generate your personalised roadmap.</p>
          </div>
        ) : (
          <div className="timeline" style={{ marginTop: 8 }}>
            {data.milestones.map((m, i) => {
              const isDone = m.completed || m.status === 'completed'
              const isActive = !isDone && i === data.milestones.findIndex(x => !x.completed && x.status !== 'completed')
              return (
                <div className="timeline-item" key={m.id}>
                  <div className={`timeline-dot${isDone ? ' done' : isActive ? ' active' : ''}`}>
                    {isDone && (
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div className="card card-sm col gap6" style={{
                    borderColor: isActive ? 'var(--accent)' : isDone ? 'var(--border)' : 'var(--border)',
                    opacity: isDone ? 0.6 : 1,
                  }}>
                    <div className="row between">
                      <span className="pill pill-muted">Week {m.week_number}</span>
                      {isDone && <span className="pill pill-success">✓ Done</span>}
                      {isActive && <span className="pill pill-accent">Active</span>}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{m.title}</p>
                    {m.description && <p className="text-sm text-muted">{m.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
