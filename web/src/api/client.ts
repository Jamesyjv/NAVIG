import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ?? 'https://navig.onrender.com'

export const api = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('navig_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export const authAPI = {
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }),
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  me: () => api.get('/auth/me'),
}

export const goalsAPI = {
  create: (title: string) => api.post('/goals/', { title }),
  getActive: () => api.get('/goals/active'),
  updateActive: (data: object) => api.put('/goals/active', data),
}

export const roadmapAPI = {
  generate: () => api.post('/roadmap/generate'),
  get: (goalId: string) => api.get(`/roadmap/${goalId}`),
}

export const missionsAPI = {
  getToday: () => api.get('/missions/today'),
  complete: (id: string) => api.post(`/missions/${id}/complete`),
}

export const progressAPI = {
  get: (goalId: string) => api.get(`/progress/${goalId}`),
  completeMilestone: (id: string) => api.post(`/milestones/${id}/complete`),
}

export const decisionAPI = {
  ask: (goalId: string, question: string) =>
    api.post('/decision/ask', { goal_id: goalId, question }),
  history: () => api.get('/decision/history'),
}
