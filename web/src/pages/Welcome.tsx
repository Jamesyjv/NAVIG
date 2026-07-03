import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api/client'
import { useAuth } from '../store/auth'

type Mode = 'welcome' | 'login' | 'register'

export default function Welcome() {
  const [mode, setMode] = useState<Mode>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, activeGoal } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        await authAPI.register(email.trim(), name.trim(), password)
      }
      const res = await authAPI.login(email.trim(), password)
      await login(res.data.access_token)
      navigate(activeGoal ? '/home' : '/goal', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'welcome') {
    return (
      <div
        className="animate-in"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: 'calc(var(--safe-top) + 40px) 28px calc(var(--safe-bottom) + 36px)',
          justifyContent: 'space-between',
          background: 'var(--bg)',
        }}
      >
        {/* Top brand area */}
        <div style={{ paddingTop: 24 }}>
          <p className="t-overline" style={{ marginBottom: 16 }}>Navigation for your goals</p>
          <h1 className="wordmark">NAVIG</h1>
          <p style={{
            marginTop: 20,
            fontSize: 15,
            color: 'var(--t2)',
            lineHeight: 1.6,
            fontWeight: 400,
            maxWidth: 260,
          }}>
            An AI that breaks down your ambitions into daily, actionable steps.
          </p>
        </div>

        {/* Decorative mid element */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            {/* Outer faint ring */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: '1px solid var(--line)',
            }} />
            {/* Middle ring */}
            <div style={{
              position: 'absolute', inset: 32,
              borderRadius: '50%',
              border: '1px solid rgba(0,212,255,0.15)',
            }} />
            {/* Inner accent dot */}
            <div style={{
              position: 'absolute', inset: 72,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 12, height: 12,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 16px var(--accent)',
              }} />
            </div>
            {/* Orbit dots */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 6, height: 6,
                borderRadius: '50%',
                background: i % 2 === 0 ? 'var(--accent)' : 'var(--line-strong)',
                top: '50%', left: '50%',
                transform: `rotate(${deg}deg) translateX(92px) translateY(-50%)`,
                opacity: i % 2 === 0 ? 0.7 : 0.3,
              }} />
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="col gap8">
          <button className="btn btn-primary" onClick={() => setMode('register')}>
            Get started
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('login')}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="animate-in"
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        padding: 'calc(var(--safe-top) + 20px) 24px calc(var(--safe-bottom) + 28px)',
        gap: 28,
      }}
    >
      {/* Back */}
      <button className="back-btn" onClick={() => { setMode('welcome'); setError('') }}>
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      {/* Header */}
      <div className="col gap6">
        <h2 className="t-title">{mode === 'register' ? 'Create an account' : 'Welcome back'}</h2>
        <p className="t-sm t-muted">
          {mode === 'register'
            ? 'Set up your account to start building your roadmap.'
            : 'Continue where you left off.'}
        </p>
      </div>

      {/* Form */}
      <form className="col gap12" onSubmit={handleSubmit} style={{ flex: 1 }}>
        {mode === 'register' && (
          <div className="field">
            <p className="input-label">Full name</p>
            <input
              className="input"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}
        <div className="field">
          <p className="input-label">Email</p>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <p className="input-label">Password</p>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--danger)', lineHeight: 1.4 }}>{error}</p>
        )}

        <div style={{ flex: 1, minHeight: 12 }} />

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading
            ? <span className="spinner" />
            : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}
        >
          {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
        </button>
      </form>
    </div>
  )
}
