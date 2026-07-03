import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { missionsAPI } from '../api/client'
import { useAuth } from '../store/auth'

interface Mission {
  id: string; task: string; why: string | null
  estimated_minutes: number | null; priority: string; completed: boolean
}

const PRIORITY_COLOR: Record<string, string> = {
  high:   'var(--danger)',
  medium: 'var(--warn)',
  low:    'var(--t3)',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { user, activeGoal, logout } = useAuth()
  const [missions, setMissions]         = useState<Mission[]>([])
  const [loading, setLoading]           = useState(true)
  const [completing, setCompleting]     = useState<string | null>(null)
  const [menuOpen, setMenuOpen]         = useState(false)
  const navigate = useNavigate()

  const fetchMissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await missionsAPI.getToday()
      setMissions(Array.isArray(res.data) ? res.data : [])
    } catch { setMissions([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetchMissions() }, [fetchMissions])

  const complete = async (id: string) => {
    setCompleting(id)
    try {
      await missionsAPI.complete(id)
      setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m))
    } finally { setCompleting(null) }
  }

  const done  = missions.filter(m => m.completed).length
  const total = missions.length

  return (
    <div className="page animate-in" onClick={() => menuOpen && setMenuOpen(false)}>
      <div className="page-inner">

        {/* Header row */}
        <div className="row between" style={{ paddingTop: 6, position: 'relative' }}>
          <div className="col gap2">
            <p style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>{getGreeting()}</p>
            <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
              {user?.name?.split(' ')[0] ?? 'Navigator'}
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              className="avatar-btn"
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              aria-label="Profile menu"
            >
              {(user?.name?.[0] ?? 'N').toUpperCase()}
            </button>
            {menuOpen && (
              <div className="ctx-menu" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setMenuOpen(false); navigate('/goal') }}>
                  Change goal
                </button>
                <div className="divider" />
                <button className="ctx-danger" onClick={() => { logout(); navigate('/') }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active goal strip */}
        {activeGoal && (
          <div className="goal-strip">
            <div className="goal-strip-dot" />
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t2)', flex: 1 }} className="text-truncate">
              {activeGoal.title}
            </p>
          </div>
        )}

        {/* Progress row */}
        {total > 0 && (
          <div className="col gap8" style={{ marginTop: 2 }}>
            <div className="row between">
              <p style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>
                Today's progress
              </p>
              <p style={{ fontSize: 12, color: done === total && total > 0 ? 'var(--success)' : 'var(--t3)', fontWeight: 600 }}>
                {done} / {total}
              </p>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Section heading */}
        <p className="section-head" style={{ marginTop: 8 }}>Missions</p>

        {/* Content */}
        {loading ? (
          <div className="loading-center"><div className="spinner-lg" /></div>
        ) : missions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--t1)' }}>All caught up</p>
            <p className="t-sm t-muted" style={{ lineHeight: 1.5 }}>
              No missions scheduled for today.<br />Pull to refresh or check back later.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={fetchMissions}
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="col gap10">
            {missions.map(m => (
              <MissionCard
                key={m.id}
                mission={m}
                onComplete={() => complete(m.id)}
                completing={completing === m.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MissionCard({ mission, onComplete, completing }: {
  mission: Mission; onComplete: () => void; completing: boolean
}) {
  const dotColor = PRIORITY_COLOR[mission.priority] ?? 'var(--t3)'

  return (
    <div className={`mission-card${mission.completed ? ' done' : ''}`}>
      <button
        className={`check-ring${mission.completed ? ' checked' : ''}`}
        onClick={onComplete}
        disabled={mission.completed || completing}
        aria-label="Mark complete"
      >
        {completing ? (
          <div style={{
            width: 9, height: 9,
            border: '1.5px solid var(--t3)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: '_spin 0.6s linear infinite',
          }} />
        ) : mission.completed ? (
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        ) : null}
      </button>

      <div className="col flex1" style={{ gap: 6 }}>
        <p style={{
          fontWeight: 500, fontSize: 14,
          color: mission.completed ? 'var(--t3)' : 'var(--t1)',
          textDecoration: mission.completed ? 'line-through' : 'none',
          lineHeight: 1.4,
        }}>
          {mission.task}
        </p>
        {mission.why && (
          <p className="t-sm" style={{ color: 'var(--t3)', lineHeight: 1.4 }}>
            {mission.why}
          </p>
        )}
        <div className="row gap8" style={{ marginTop: 2 }}>
          <div className="mission-priority-dot" style={{ background: dotColor }} />
          <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500, textTransform: 'capitalize' }}>
            {mission.priority}
          </p>
          {mission.estimated_minutes && (
            <>
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>·</p>
              <p style={{ fontSize: 11, color: 'var(--t3)' }}>{mission.estimated_minutes} min</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
