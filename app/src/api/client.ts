import axios from 'axios'
import { useUserStore } from '../store/userStore'

// Reads from .env (EXPO_PUBLIC_API_URL=http://localhost:8000 for local dev)
// Falls back to the deployed Render backend
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://navig-api.onrender.com'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  const token = useUserStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const authAPI = {
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/auth/me'),
}

// Goals
export const goalsAPI = {
  create: (title: string) => api.post('/goals/', { title }),
  getActive: () => api.get('/goals/active'),
  updateActive: (data: {
    category?: string
    experience_level?: string
    hours_per_week?: number
    budget_usd?: number
    deadline_weeks?: number
  }) => api.put('/goals/active', data),
}

// Roadmap
export const roadmapAPI = {
  generate: () => api.post('/roadmap/generate'),
  get: (goalId: string) => api.get(`/roadmap/${goalId}`),
}

// Missions
export const missionsAPI = {
  getToday: () => api.get('/missions/today'),
  complete: (id: string) => api.post(`/missions/${id}/complete`),
}

// Progress
export const progressAPI = {
  get: (goalId: string) => api.get(`/progress/${goalId}`),
  completeMilestone: (id: string) => api.post(`/milestones/${id}/complete`),
}

// Decision
export const decisionAPI = {
  ask: (goalId: string, question: string) =>
    api.post('/decision/ask', { goal_id: goalId, question }),
  history: () => api.get('/decision/history'),
}
