import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI, goalsAPI } from '../api/client'

interface User { id: string; email: string; name: string }
interface Goal {
  id: string; title: string; category: string | null
  experience_level: string | null; hours_per_week: number | null
  budget_usd: number | null; deadline_weeks: number | null; status: string
}

interface AuthState {
  token: string | null
  user: User | null
  activeGoal: Goal | null
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  setActiveGoal: (g: Goal) => void
  updateActiveGoal: (patch: Partial<Goal>) => void
}

const Ctx = createContext<AuthState>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('navig_token'))
  const [user, setUser] = useState<User | null>(null)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, hydrate from token
  useEffect(() => {
    if (!token) { setLoading(false); return }
    ;(async () => {
      try {
        const me = await authAPI.me()
        setUser(me.data)
        try {
          const goal = await goalsAPI.getActive()
          setActiveGoal(goal.data)
        } catch { /* no active goal yet */ }
      } catch {
        // Token expired / invalid
        localStorage.removeItem('navig_token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (newToken: string) => {
    localStorage.setItem('navig_token', newToken)
    setToken(newToken)
    const me = await authAPI.me()
    setUser(me.data)
    try {
      const goal = await goalsAPI.getActive()
      setActiveGoal(goal.data)
    } catch { setActiveGoal(null) }
  }

  const logout = () => {
    localStorage.removeItem('navig_token')
    setToken(null); setUser(null); setActiveGoal(null)
  }

  const updateActiveGoal = (patch: Partial<Goal>) =>
    setActiveGoal(prev => prev ? { ...prev, ...patch } : prev)

  return (
    <Ctx.Provider value={{ token, user, activeGoal, loading, login, logout, setActiveGoal, updateActiveGoal }}>
      {children}
    </Ctx.Provider>
  )
}
