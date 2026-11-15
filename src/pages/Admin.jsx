import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { mediaPathsIn, removeMedia } from '../lib/media'

export default function Admin() {
  const [mods, setMods] = useState(null)
  const load = () => supabase.from('modules').select('id,title,role,published,steps').order('created_at')
    .then(({ data }) => setMods(data))
  useEffect(() => { load() }, [])

  async function togglePublish(m) {
    await supabase.from('modules').update({ published: !m.published }).eq('id', m.id)
    load()
  }
  async function remove(m) {
    if (!confirm(`Delete “${m.title}” and its uploaded images and videos? This can’t be undone.`)) return
    const { error } = await supabase.from('modules').delete().eq('id', m.id)
    if (error) return alert(error.message)
    await removeMedia(mediaPathsIn(m.steps))
    load()
  }

  if (!mods) return <p>Loading…</p>
  return (
    <>
      <div className="row"><h1>Manage content</h1><Link className="btn primary" to="/admin/new">New guide</Link></div>
      <div className="panel">
        {mods.length === 0 && <p className="muted">No guides yet. Create your first one.</p>}
        {mods.map((m) => (
          <div className="list" key={m.id}>
            <div>
              <b>{m.title}</b><br />
              <span className="muted">{m.role}, {m.steps.length} steps, {m.published ? 'Published' : 'Draft'}</span>
            </div>
            <span>
              <Link className="btn" to={`/admin/${m.id}`}>Edit</Link>{' '}
              <button onClick={() => togglePublish(m)}>{m.published ? 'Unpublish' : 'Publish'}</button>{' '}
              <button className="danger" onClick={() => remove(m)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
