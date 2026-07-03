import { useState, useEffect, useCallback } from 'react'
import { progressAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Milestone { id: string; title: string; week_number: number; completed: boolean }
interface ProgressData {
  completed_milestones: number; total_milestones: number
  completed_missions: number; total_missions: number
  current_week: number; milestones: Milestone[]
}

export default function Progress() {
  const { activeGoal } = useAuth()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!activeGoal) { setLoading(false); return }
    try {
      const res = await progressAPI.get(activeGoal.id)
      setData(res.data)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [activeGoal])

  useEffect(() => { fetch() }, [fetch])

  const toggle = async (id: string) => {
    try {
      await progressAPI.completeMilestone(id)
      setData(prev => {
        if (!prev) return prev
        const updated = prev.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
        const done = updated.filter(m => m.completed).length
        return { ...prev, milestones: updated, completed_milestones: done }
      })
    } catch { /* ignore */ }
  }

  const milePct = data && data.total_milestones > 0 ? Math.round((data.completed_milestones / data.total_milestones) * 100) : 0
  const missPct = data && data.total_missions > 0 ? Math.round((data.completed_missions / data.total_missions) * 100) : 0

  return (
    <div className="page page-enter">
      <div className="page-inner">
        <div className="col gap4">
          <p className="text-xs text-accent upper">Your Progress</p>
          <p style={{ fontWeight: 700, fontSize: 22 }}>{activeGoal?.title ?? 'Overview'}</p>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : !data ? (
          <div className="empty-state">
            <span className="empty-emoji">📊</span>
            <p style={{ fontWeight: 700, fontSize: 18 }}>No progress data yet</p>
            <p className="text-sm text-muted">Complete your first mission to see progress here.</p>
          </div>
        ) : (
          <>
            {/* Stats ring row */}
            <div className="card" style={{ display: 'flex', gap: 0, padding: 0, overflow: 'hidden' }}>
              <StatRing label="Milestones" pct={milePct} color="var(--accent)"
                sub={`${data.completed_milestones} / ${data.total_milestones}`} />
              <div style={{ width: 1, background: 'var(--border)' }} />
              <StatRing label="Missions" pct={missPct} color="var(--success)"
                sub={`${data.completed_missions} / ${data.total_missions}`} />
            </div>

            {/* Current week */}
            <div className="card card-sm row between">
              <div>
                <p className="text-xs text-accent upper">Current Week</p>
                <p style={{ fontWeight: 700, fontSize: 20, marginTop: 4 }}>Week {data.current_week}</p>
              </div>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>

            {/* Milestones list */}
            <p style={{ fontWeight: 700, fontSize: 17 }}>All Milestones</p>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {data.milestones.map((m, i) => (
                <div key={m.id} className="milestone-row" style={i === data.milestones.length - 1 ? { borderBottom: 'none' } : {}}>
                  <div className="milestone-dot" style={{ background: m.completed ? 'var(--accent)' : 'var(--border)' }} />
                  <div className="col flex1 gap4">
                    <p style={{ fontWeight: 600, fontSize: 14, textDecoration: m.completed ? 'line-through' : 'none', opacity: m.completed ? 0.6 : 1 }}>{m.title}</p>
                    <p className="text-xs text-muted">Week {m.week_number}</p>
                  </div>
                  <button
                    onClick={() => toggle(m.id)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: `2px solid ${m.completed ? 'var(--accent)' : 'var(--border)'}`,
                      background: m.completed ? 'var(--accent)' : 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                    aria-label="Toggle milestone"
                  >
                    {m.completed && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatRing({ label, pct, color, sub }: { label: string; pct: number; color: string; sub: string }) {
  const size = 100; const stroke = 8
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px' }}>
      <div className="ring-container" style={{ width: size, height: size }}>
        <svg className="ring-svg" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" className="ring-track"
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 20, color }}>{pct}%</p>
        </div>
      </div>
      <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--muted)' }}>{label}</p>
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</p>
    </div>
  )
}
