import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import Library from './pages/Library'
import Module from './pages/Module'
import Account from './pages/Account'
import Admin from './pages/Admin'
import Editor from './pages/Editor'

function AdminOnly({ children }) {
  const { ready, session, profile, isAdmin } = useAuth()
  if (!ready || (session && !profile)) return <p>Loading…</p>
  if (!session) return <Navigate to="/account" replace />
  return isAdmin ? children : <p>This account doesn’t have admin access.</p>
}

export default function App() {
  const { session, profile, isAdmin } = useAuth()
  return (
    <>
      <header>
        <Link to="/" className="logo">Akamata</Link>
        <nav>
          {isAdmin && <Link to="/admin">Manage content</Link>}
          <Link to="/account">{session ? (profile?.name || 'Account') : 'Save my progress'}</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/m/:id" element={<Module />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
          <Route path="/admin/:id" element={<AdminOnly><Editor /></AdminOnly>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  )
}
