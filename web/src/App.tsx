import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/auth'
import BottomNav from './components/BottomNav'

import Welcome    from './pages/Welcome'
import GoalCreation from './pages/GoalCreation'
import Assessment from './pages/Assessment'
import Home       from './pages/Home'
import Roadmap    from './pages/Roadmap'
import Progress   from './pages/Progress'
import Decision   from './pages/Decision'

// ── Guards ──────────────────────────────────────────────────────────────────

/** Redirect to / if not logged in */
function RequireAuth() {
  const { token, loading } = useAuth()
  if (loading) return <Spinner />
  if (!token) return <Navigate to="/" replace />
  return <Outlet />
}

/** Redirect to /home if already logged in */
function RequireGuest() {
  const { token, loading, activeGoal } = useAuth()
  if (loading) return <Spinner />
  if (token) return <Navigate to={activeGoal ? '/home' : '/goal'} replace />
  return <Outlet />
}

/** Main tab layout — page area + bottom nav */
function TabLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

function Spinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-lg" />
    </div>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            {/* Public */}
            <Route element={<RequireGuest />}>
              <Route path="/" element={<Welcome />} />
            </Route>

            {/* Onboarding — logged-in required */}
            <Route element={<RequireAuth />}>
              <Route path="/goal"       element={<GoalCreation />} />
              <Route path="/assessment" element={<Assessment />} />
            </Route>

            {/* Main tabs — logged-in + bottom nav */}
            <Route element={<RequireAuth />}>
              <Route element={<TabLayout />}>
                <Route path="/home"     element={<Home />} />
                <Route path="/roadmap"  element={<Roadmap />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/decision" element={<Decision />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
