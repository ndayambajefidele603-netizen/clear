import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Clearance from './pages/Clearance'
import Transcript from './pages/Transcript'
import Documents from './pages/Documents'
import LeaderDashboard from './pages/LeaderDashboard'
import Notifications from './components/Notifications'
import { AppProvider, useApp } from './context/AppContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, sessionReady } = useApp()
  if (!sessionReady) return <div className="auth-session-loading" role="status">Restoring your secure portal session…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LeaderRoute({ children }: { children: React.ReactNode }) {
  const { user, sessionReady } = useApp()
  if (!sessionReady) return <div className="auth-session-loading" role="status">Restoring your secure portal session…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'leader') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clearance" element={<ProtectedRoute><Clearance /></ProtectedRoute>} />
        <Route path="/transcript" element={<ProtectedRoute><Transcript /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
        <Route path="/leader" element={<LeaderRoute><LeaderDashboard /></LeaderRoute>} />
      </Routes>
    </main>
  )
}

function App() {
  return (
    <AppProvider>
      <Notifications />
      <Navbar />
      <AppRoutes />
      <Footer />
    </AppProvider>
  )
}

export default App