import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { missionsAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Mission {
  id: string; task: string; why: string | null
  estimated_minutes: number | null; priority: string; completed: boolean
}

export default function Home() {
  const { user, activeGoal, logout } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [showLogout, setShowLogout] = useState(false)
  const navigate = useNavigate()

  const fetchMissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await missionsAPI.getToday()
      setMissions(Array.isArray(res.data) ? res.data : [])
    } catch { setMissions([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMissions() }, [fetchMissions])

  const complete = async (id: string) => {
    setCompleting(id)
    try {
      await missionsAPI.complete(id)
      setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m))
    } finally { setCompleting(null) }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const done = missions.filter(m => m.completed).length
  const total = missions.length

  return (
    <div className="page page-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-inner">
        {/* Header */}
        <div className="row between" style={{ paddingTop: 4 }}>
          <div className="col gap4">
            <p className="text-sm text-muted">{greeting},</p>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{user?.name ?? 'Navigator'} 👋</p>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="avatar" onClick={() => setShowLogout(v => !v)}>
              {(user?.name?.[0] ?? 'N').toUpperCase()}
            </button>
            {showLogout && (
              <div style={{
                position: 'absolute', right: 0, top: 48, background: 'var(--card)',
                border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                zIndex: 100, minWidth: 140,
              }}>
                <button
                  onClick={() => { setShowLogout(false); navigate('/goal') }}
                  style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text)', fontSize: 14, cursor: 'pointer', textAlign: 'left' }}
                >
                  🎯 Change Goal
                </button>
                <div className="divider" />
                <button
                  onClick={() => { logout(); navigate('/') }}
                  style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: 'var(--error)', fontSize: 14, cursor: 'pointer', textAlign: 'left' }}
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active goal */}
        {activeGoal && (
          <div className="card card-sm col gap4">
            <p className="text-xs text-accent upper">Active Goal</p>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{activeGoal.title}</p>
          </div>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div className="col gap6" style={{ gap: 8 }}>
            <div className="row between">
              <p className="text-sm text-muted">Today's progress</p>
              <p className="text-sm text-accent">{done}/{total}</p>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Missions */}
        <p style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>Today's Missions</p>

        {loading ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : missions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-emoji">🎯</span>
            <p style={{ fontWeight: 700, fontSize: 18 }}>No missions yet</p>
            <p className="text-sm text-muted">Your AI coach is preparing today's tasks. Pull down to refresh.</p>
            <button className="btn btn-outline" style={{ width: 'auto', paddingInline: 24 }} onClick={fetchMissions}>
              Refresh
            </button>
          </div>
        ) : (
          missions.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              onComplete={() => complete(m.id)}
              completing={completing === m.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function MissionCard({ mission, onComplete, completing }: {
  mission: Mission; onComplete: () => void; completing: boolean
}) {
  const priorityColor = mission.priority === 'high' ? 'var(--error)'
    : mission.priority === 'medium' ? 'var(--warning)' : 'var(--muted)'

  return (
    <div className={`mission-card${mission.completed ? ' done' : ''}`}>
      <button
        className={`check-btn${mission.completed ? ' checked' : ''}`}
        onClick={onComplete}
        disabled={mission.completed || completing}
        aria-label="Mark complete"
      >
        {completing
          ? <div style={{ width: 10, height: 10, border: '2px solid var(--muted)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          : mission.completed
            ? <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            : null
        }
      </button>
      <div className="col gap6" style={{ flex: 1, gap: 6 }}>
        <p style={{ fontWeight: 600, fontSize: 15, textDecoration: mission.completed ? 'line-through' : 'none', opacity: mission.completed ? 0.6 : 1 }}>
          {mission.task}
        </p>
        {mission.why && <p className="text-sm text-muted">{mission.why}</p>}
        <div className="row gap8" style={{ marginTop: 2 }}>
          {mission.estimated_minutes && (
            <span className="pill pill-muted">⏱ {mission.estimated_minutes}m</span>
          )}
          <span className="pill" style={{ background: 'transparent', border: `1px solid ${priorityColor}`, color: priorityColor }}>
            {mission.priority}
          </span>
        </div>
      </div>
    </div>
  )
}
