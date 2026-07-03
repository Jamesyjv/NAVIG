import { useState, FormEvent, useRef, MouseEvent, TouchEvent } from 'react'
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
  const { login } = useAuth()
  const navigate = useNavigate()

  // Binoculars Rotation State
  const [rotation, setRotation] = useState(0)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const currentRotation = useRef(0)

  const handlePointerDown = (clientX: number) => {
    isDragging.current = true
    startX.current = clientX
    currentRotation.current = rotation
  }

  const handlePointerMove = (clientX: number) => {
    if (!isDragging.current) return
    const deltaX = clientX - startX.current
    // 1px delta = 0.8 degree rotation
    setRotation(currentRotation.current + deltaX * 0.8)
  }

  const handlePointerUp = () => {
    isDragging.current = false
  }

  const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX)
  const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX)
  const onMouseUp = () => handlePointerUp()

  const onTouchStart = (e: TouchEvent) => handlePointerDown(e.touches[0].clientX)
  const onTouchMove = (e: TouchEvent) => handlePointerMove(e.touches[0].clientX)
  const onTouchEnd = () => handlePointerUp()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        await authAPI.register(email.trim(), name.trim(), password)
      }
      const res = await authAPI.login(email.trim(), password)
      // Call updated login store function that returns the fetched goal
      const fetchedGoal = await login(res.data.access_token)
      navigate(fetchedGoal ? '/home' : '/goal', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e?.response?.data?.detail ?? 'Incorrect credentials or error occurred.')
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
            maxWidth: 280,
          }}>
            Find clarity, focus, and your next best step.
          </p>
        </div>

        {/* Vintage Binoculars Interactive Area */}
        <div 
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div style={{
            transform: `rotate(${rotation}deg)`,
            transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            width: 180,
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Binoculars Vector Illustration */}
            <svg viewBox="0 0 100 80" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Central axis / hinge */}
              <rect x="47" y="25" width="6" height="30" rx="2" fill="var(--t3)" />
              <rect x="45" y="30" width="10" height="4" fill="var(--t2)" />
              <rect x="45" y="46" width="10" height="4" fill="var(--t2)" />
              
              {/* Left Barrel */}
              <path d="M22 15 L43 25 L40 55 L20 65 Z" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="1.5" />
              {/* Left Lens / eyepiece */}
              <ellipse cx="22" cy="15" rx="4" ry="2" fill="var(--t3)" stroke="var(--line)" />
              {/* Left Objective / large lens */}
              <ellipse cx="20" cy="65" rx="8" ry="4" fill="var(--accent-glow)" stroke="var(--accent)" strokeWidth="1.5" />
              <ellipse cx="20" cy="65" rx="5" ry="2.5" fill="var(--accent-faint)" />
              
              {/* Right Barrel */}
              <path d="M78 15 L57 25 L60 55 L80 65 Z" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="1.5" />
              {/* Right Lens / eyepiece */}
              <ellipse cx="78" cy="15" rx="4" ry="2" fill="var(--t3)" stroke="var(--line)" />
              {/* Right Objective / large lens */}
              <ellipse cx="80" cy="65" rx="8" ry="4" fill="var(--accent-glow)" stroke="var(--accent)" strokeWidth="1.5" />
              <ellipse cx="80" cy="65" rx="5" ry="2.5" fill="var(--accent-faint)" />

              {/* Brass details / vintage accents */}
              <line x1="22" y1="20" x2="43" y2="30" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2,2" />
              <line x1="78" y1="20" x2="57" y2="30" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
          </div>
          <p style={{
            fontSize: 11,
            color: 'var(--t3)',
            marginTop: 18,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            Drag to rotate your lens
          </p>
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
