import { useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import { Mark } from './components/Art'
import Footer from './components/Footer'
import Library from './pages/Library'
import Module from './pages/Module'
import Account from './pages/Account'
import Admin from './pages/Admin'
import Editor from './pages/Editor'
import Suggest from './pages/Suggest'
import Requests from './pages/Requests'
import Contact from './pages/Contact'
import Pathway from './pages/Pathway'
import Pathways from './pages/Pathways'
import PathwayEditor from './pages/PathwayEditor'
import { Privacy, Story, Terms } from './pages/Static'

function AdminOnly({ children }) {
  const { ready, session, profile, isAdmin } = useAuth()
  if (!ready || (session && !profile)) return <p>Loading…</p>
  if (!session) return <Navigate to="/account" replace />
  return isAdmin ? children : <p>This account doesn’t have admin access.</p>
}

export default function App() {
  const { session, profile, isAdmin } = useAuth()
  const { pathname, hash } = useLocation()
  const home = pathname === '/'
  const wide = home || pathname.startsWith('/p/')

  useEffect(() => { if (!hash) window.scrollTo(0, 0) }, [pathname, hash])

  return (
    <>
      <header className="top">
        <div className="in">
          <Link to="/" className="logo"><span className="mark"><Mark /></span>Akamata</Link>
          <nav className="main-nav">
            <Link to="/#roadmaps" className={'hide-sm' + (home ? ' on' : '')}>Explore roadmaps</Link>
            <Link to="/#how" className="hide-sm">How it works</Link>
            <Link to="/story" className={'hide-sm' + (pathname === '/story' ? ' on' : '')}>Our story</Link>
            {isAdmin && <Link to="/admin">Manage content</Link>}
            <Link to="/account" className="pill">{session ? (profile?.name || 'Account') : 'Save my progress'}</Link>
          </nav>
        </div>
      </header>
      <main className={wide ? 'wide' : ''}>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/m/:id" element={<Module />} />
          <Route path="/account" element={<Account />} />
          <Route path="/story" element={<Story />} />
          <Route path="/suggest" element={<Suggest />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/p/:id" element={<Pathway />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
          <Route path="/admin/requests" element={<AdminOnly><Requests /></AdminOnly>} />
          <Route path="/admin/pathways" element={<AdminOnly><Pathways /></AdminOnly>} />
          <Route path="/admin/pathways/:id" element={<AdminOnly><PathwayEditor /></AdminOnly>} />
          <Route path="/admin/:id" element={<AdminOnly><Editor /></AdminOnly>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
