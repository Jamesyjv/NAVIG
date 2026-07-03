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
      // login() hydrates activeGoal internally; check after
      navigate(activeGoal ? '/home' : '/goal', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail ?? 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'welcome') {
    return (
      <div className="onboarding page-enter" style={{ justifyContent: 'space-between' }}>
        {/* Hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative' }}>
          <div className="accent-glow" />
          <p className="text-xs text-accent upper" style={{ letterSpacing: 4 }}>Welcome to</p>
          <h1 className="logo">NAVIG</h1>
          <p className="text-md text-muted" style={{ textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
            The AI that always knows<br />your next best step.
          </p>
        </div>

        {/* Actions */}
        <div className="col gap12">
          <button className="btn btn-primary" onClick={() => setMode('register')}>
            Get Started
          </button>
          <button className="btn btn-outline" onClick={() => setMode('login')}>
            I already have an account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding page-enter">
      <button
        onClick={() => setMode('welcome')}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}
      >
        ← Back
      </button>

      <div className="col gap4">
        <h2 className="text-title">{mode === 'register' ? 'Create account' : 'Welcome back'}</h2>
        <p className="text-sm text-muted">{mode === 'register' ? 'Start navigating your goals today.' : 'Good to see you again.'}</p>
      </div>

      <form className="col gap12" onSubmit={handleSubmit} style={{ flex: 1 }}>
        {mode === 'register' && (
          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoComplete="name"
          />
        )}
        <input
          className="input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        />

        {error && (
          <p style={{ color: 'var(--error)', fontSize: 13, textAlign: 'center' }}>{error}</p>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? <span className="spinner" /> : mode === 'register' ? 'Create Account' : 'Log In'}
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}
        >
          {mode === 'register' ? 'Already have an account? Log in' : "New here? Create account"}
        </button>
      </form>
    </div>
  )
}
