import { create } from 'zustand'
import { saveToken, getToken, deleteToken } from '../utils/secureStorage'

interface User {
  id: string
  email: string
  name: string
  created_at: string
}

interface Goal {
  id: string
  user_id: string
  title: string
  category: string | null
  experience_level: string | null
  hours_per_week: number | null
  budget_usd: number | null
  deadline_weeks: number | null
  status: string
  created_at: string
}

interface UserStore {
  user: User | null
  token: string | null
  activeGoal: Goal | null

  // Actions
  setUser: (user: User) => void
  /** Saves token both in Zustand state and SecureStore */
  setToken: (token: string) => Promise<void>
  setActiveGoal: (goal: Goal) => void
  updateActiveGoal: (updates: Partial<Goal>) => void
  /** Loads token from SecureStore on app boot */
  hydrateToken: () => Promise<void>
  /** Clears all user state and deletes stored token */
  logout: () => Promise<void>
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  token: null,
  activeGoal: null,

  setUser: (user) => set({ user }),

  setToken: async (token) => {
    await saveToken(token)
    set({ token })
  },

  setActiveGoal: (goal) => set({ activeGoal: goal }),

  updateActiveGoal: (updates) => {
    const current = get().activeGoal
    if (current) set({ activeGoal: { ...current, ...updates } })
  },

  hydrateToken: async () => {
    const stored = await getToken()
    if (stored) set({ token: stored })
  },

  logout: async () => {
    await deleteToken()
    set({ user: null, token: null, activeGoal: null })
  },
}))
