import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Conversations from './pages/Conversations'
import ApiKeys from './pages/ApiKeys'
import Login from './pages/Login'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading" style={{ height: '100vh' }}>
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/conversations/:id" element={<Conversations />} />
          <Route path="/api-keys" element={<ApiKeys />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function LoginGuard() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading" style={{ height: '100vh' }}>Loading…</div>
  if (user) return <Navigate to="/" replace />
  return <Login />
}
