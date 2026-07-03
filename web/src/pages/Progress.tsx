import { useState, useEffect, useCallback } from 'react'
import { progressAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Milestone { id: string; title: string; week_number: number; completed: boolean }
interface ProgressData {
  completed_milestones: number; total_milestones: number
  completed_missions: number;   total_missions: number
  current_week: number;         milestones: Milestone[]
}

export default function Progress() {
  const { activeGoal } = useAuth()
  const [data, setData]       = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!activeGoal) { setLoading(false); return }
    try {
      const res = await progressAPI.get(activeGoal.id)
      setData(res.data)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [activeGoal])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string) => {
    try {
      await progressAPI.completeMilestone(id)
      setData(prev => {
        if (!prev) return prev
        const updated = prev.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
        return { ...prev, milestones: updated, completed_milestones: updated.filter(m => m.completed).length }
      })
    } catch { /* ignore */ }
  }

  const milePct = data && data.total_milestones > 0 ? Math.round((data.completed_milestones / data.total_milestones) * 100) : 0
  const missPct = data && data.total_missions   > 0 ? Math.round((data.completed_missions   / data.total_missions)   * 100) : 0

  return (
    <div className="page animate-in">
      <div className="page-inner">
        <div className="col gap4" style={{ paddingTop: 6 }}>
          <p className="t-overline">Progress</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.25 }}>
            {activeGoal?.title ?? 'Overview'}
          </h1>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : !data ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 16 }}>No data yet</p>
            <p className="t-sm t-muted" style={{ lineHeight: 1.5 }}>
              Complete your first mission to start tracking progress.
            </p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="row gap10" style={{ marginTop: 4 }}>
              <RingCard label="Milestones" pct={milePct} color="var(--accent)"
                sub={`${data.completed_milestones} of ${data.total_milestones}`} />
              <RingCard label="Missions" pct={missPct} color="var(--success)"
                sub={`${data.completed_missions} of ${data.total_missions}`} />
            </div>

            {/* Week */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'var(--surface)',
              borderRadius: 'var(--r2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>
              <p style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500 }}>Current week</p>
              <div className="week-badge">
                <span className="num">{data.current_week}</span>
                <span className="label">week</span>
              </div>
            </div>

            {/* Milestones */}
            <p className="section-head" style={{ marginTop: 4 }}>All milestones</p>
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--r3)', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              {data.milestones.map(m => (
                <div key={m.id} className="ms-row">
                  <div
                    className="ms-dot"
                    style={{ background: m.completed ? 'var(--success)' : 'var(--line-strong)' }}
                  />
                  <div className="col flex1 gap2">
                    <p style={{
                      fontWeight: 500, fontSize: 13,
                      color: m.completed ? 'var(--t3)' : 'var(--t1)',
                      textDecoration: m.completed ? 'line-through' : 'none',
                    }}>
                      {m.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--t3)' }}>Week {m.week_number}</p>
                  </div>
                  <button
                    onClick={() => toggle(m.id)}
                    aria-label="Toggle milestone"
                    style={{
                      width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                      background: m.completed ? 'var(--success)' : 'transparent',
                      border: `1.5px solid ${m.completed ? 'var(--success)' : 'var(--line-strong)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                  >
                    {m.completed && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

function RingCard({ label, pct, color, sub }: { label: string; pct: number; color: string; sub: string }) {
  const sz = 88; const sw = 7
  const r  = (sz - sw) / 2
  const c  = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="stat-card">
      <div style={{ position: 'relative', width: sz, height: sz }}>
        <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={sz/2} cy={sz/2} r={r} stroke="var(--line)" strokeWidth={sw} fill="none" />
          <circle
            cx={sz/2} cy={sz/2} r={r} stroke={color} strokeWidth={sw} fill="none"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            className="ring-svg-track"
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{ fontWeight: 700, fontSize: 18, color }}>{pct}%</p>
        </div>
      </div>
      <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--t2)' }}>{label}</p>
      <p style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</p>
    </div>
  )
}
