import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import Conversations from './pages/Conversations'
import ApiKeys from './pages/ApiKeys'

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}
