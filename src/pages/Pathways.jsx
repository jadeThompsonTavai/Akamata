import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Pathways() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const load = () => supabase.from('pathways').select('id,title,category,published,module_ids').order('created_at')
    .then(({ data, error }) => (error ? setError(error.message) : setRows(data)))
  useEffect(() => { load() }, [])

  async function toggle(p) {
    await supabase.from('pathways').update({ published: !p.published }).eq('id', p.id)
    load()
  }
  async function remove(p) {
    if (!confirm(`Delete the pathway “${p.title}”? Its guides are kept.`)) return
    await supabase.from('pathways').delete().eq('id', p.id)
    load()
  }

  if (error) return <p>Couldn’t load pathways: {error}. Has <code>supabase/pathways.sql</code> been run?</p>
  if (!rows) return <p>Loading…</p>
  return (
    <>
      <Link to="/admin">Back to content</Link>
      <div className="row"><h1>Pathways</h1><Link className="btn primary" to="/admin/pathways/new">New pathway</Link></div>
      <div className="panel">
        {rows.length === 0 && <p className="muted">No pathways yet. Create your first one.</p>}
        {rows.map((p) => (
          <div className="list" key={p.id}>
            <div>
              <b>{p.title}</b><br />
              <span className="muted">{p.category}, {p.module_ids.length} stages, {p.published ? 'Published' : 'Draft'}</span>
            </div>
            <span>
              <Link className="btn" to={`/admin/pathways/${p.id}`}>Edit</Link>{' '}
              <button onClick={() => toggle(p)}>{p.published ? 'Unpublish' : 'Publish'}</button>{' '}
              <button className="danger" onClick={() => remove(p)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
