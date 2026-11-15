import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { useProgress } from '../lib/progress'

export default function Library() {
  const { session } = useAuth()
  const [progress] = useProgress()
  const [modules, setModules] = useState(null)
  const [role, setRole] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('modules').select('id,title,role,summary,mins,steps,quiz')
      .eq('published', true).order('created_at')
      .then(({ data, error }) => (error ? setError('Couldn’t load guides. Check your connection and try again.') : setModules(data)))
  }, [])

  if (error) return <p>{error}</p>
  if (!modules) return <p>Loading guides…</p>

  const roles = ['All', ...new Set(modules.map((m) => m.role))]
  const shown = modules.filter((m) => role === 'All' || m.role === role)
  const pct = (m) => {
    const p = progress[m.id]; const n = m.steps.length + (m.quiz ? 1 : 0)
    return p ? (p.done ? 100 : Math.round((p.step / n) * 100)) : 0
  }

  return (
    <>
      <h1>Learn the job in five-minute steps.</h1>
      <p className="muted">Free guides for what you need in your first weeks. No account needed.</p>
      {!session && (
        <div className="banner">
          <span>Your progress is saved on this device. Create an account to keep it safe.</span>
          <Link className="btn primary" to="/account">Save my progress</Link>
        </div>
      )}
      <div className="chips">
        {roles.map((r) => (
          <button key={r} className={r === role ? 'chip on' : 'chip'} onClick={() => setRole(r)}>{r}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">No guides here yet.</p>}
      <div className="grid">
        {shown.map((m) => (
          <Link key={m.id} to={`/m/${m.id}`} className="card">
            <span className="role">{m.role}</span>
            <h2>{m.title}</h2>
            <span className="muted">{m.summary}</span>
            <span className="muted">{m.mins} min, {m.steps.length} steps</span>
            <div className="bar"><i style={{ width: `${pct(m)}%` }} /></div>
          </Link>
        ))}
      </div>
    </>
  )
}
