import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const STATUSES = ['new', 'planned', 'released', 'declined']

export default function Requests() {
  const [rows, setRows] = useState(null)
  const [filter, setFilter] = useState('new')
  const [error, setError] = useState('')

  const load = () => supabase.from('requests').select('*').order('created_at', { ascending: false })
    .then(({ data, error }) => (error ? setError(error.message) : setRows(data)))
  useEffect(() => { load() }, [])

  // How many people asked for the same thing, to help decide what to build next.
  const asks = useMemo(() => {
    const c = {}
    ;(rows || []).forEach((r) => { const k = r.subject.trim().toLowerCase(); c[k] = (c[k] || 0) + 1 })
    return c
  }, [rows])

  async function setStatus(r, status) {
    await supabase.from('requests').update({ status }).eq('id', r.id)
    load()
  }
  async function remove(r) {
    if (!confirm('Delete this request? The email address is deleted with it.')) return
    await supabase.from('requests').delete().eq('id', r.id)
    load()
  }

  if (error) return <p>Couldn’t load requests: {error}</p>
  if (!rows) return <p>Loading…</p>
  const shown = rows.filter((r) => filter === 'all' || r.status === filter)

  return (
    <>
      <Link to="/admin">Back to content</Link>
      <h1>Requests</h1>
      <div className="chips">
        {['all', ...STATUSES].map((s) => (
          <button key={s} className={'chip' + (filter === s ? ' on' : '')} onClick={() => setFilter(s)}>
            {s[0].toUpperCase() + s.slice(1)} <i>{s === 'all' ? rows.length : rows.filter((r) => r.status === s).length}</i>
          </button>
        ))}
      </div>
      <div className="panel">
        {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
        {shown.map((r) => {
          const n = asks[r.subject.trim().toLowerCase()]
          return (
            <div className="req-item" key={r.id}>
              <b>{r.subject}</b>{n > 1 && <span className="tag">{n} people asked</span>}
              <div className="muted">{r.email}, {new Date(r.created_at).toLocaleDateString()}</div>
              {r.notes && <p>{r.notes}</p>}
              <div className="row">
                <select className="sort" value={r.status} onChange={(e) => setStatus(r, e.target.value)} aria-label="Status">
                  {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
                <span>
                  <a className="btn" href={`mailto:${r.email}?subject=${encodeURIComponent('Your Akamata request: ' + r.subject)}`}>Email them</a>{' '}
                  <button className="danger" onClick={() => remove(r)}>Delete</button>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
