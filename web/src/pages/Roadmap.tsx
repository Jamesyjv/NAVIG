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
  const [data, setData]     = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeGoal) { setLoading(false); return }
    try {
      const res = await roadmapAPI.get(activeGoal.id)
      setData(res.data)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [activeGoal])

  useEffect(() => { load() }, [load])

  if (!activeGoal) return (
    <div className="page animate-in">
      <div className="page-inner">
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>
          </div>
          <p style={{ fontWeight: 600, fontSize: 16 }}>No active goal</p>
          <p className="t-sm t-muted">Create a goal to see your roadmap here.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page animate-in">
      <div className="page-inner">
        {/* Header */}
        <div className="col gap4" style={{ paddingTop: 6 }}>
          <p className="t-overline">Roadmap</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.25 }}>
            {data?.goal_title ?? activeGoal.title}
          </h1>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : !data || data.milestones.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 16 }}>Roadmap not ready</p>
            <p className="t-sm t-muted" style={{ lineHeight: 1.5 }}>
              Complete the assessment to generate your personalised roadmap.
            </p>
          </div>
        ) : (
          <div className="timeline" style={{ paddingLeft: 28, marginTop: 8 }}>
            {data.milestones.map((m, i) => {
              const isDone   = m.completed || m.status === 'completed'
              const isActive = !isDone && i === data.milestones.findIndex(x => !x.completed && x.status !== 'completed')

              return (
                <div className="tl-item" key={m.id}>
                  <div className={`tl-dot tl-dot-${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                    {isDone && (
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      background: isActive ? 'var(--surface)' : 'transparent',
                      border: isActive ? '1px solid var(--line-strong)' : '1px solid transparent',
                      borderRadius: 'var(--r2)',
                      padding: '14px 16px',
                      opacity: isDone && !isActive ? 0.5 : 1,
                      boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
                        color: isActive ? 'var(--accent)' : 'var(--t3)',
                      }}>
                        Week {m.week_number}
                      </span>
                      {isDone && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                          Done
                        </span>
                      )}
                      {isActive && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                          Active
                        </span>
                      )}
                    </div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', lineHeight: 1.3 }}>
                      {m.title}
                    </p>
                    {m.description && (
                      <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 5, lineHeight: 1.5 }}>
                        {m.description}
                      </p>
                    )}
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
