import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CategoryPicker from '../components/CategoryPicker'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const blank = {
  title: '', category: '', summary: '', description: '', level: 'Beginner',
  before_you_begin: [], outcomes: [], project_title: '', project_text: '', module_ids: [], published: false
}
const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean)

export default function PathwayEditor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const [p, setP] = useState(null)
  const [missing, setMissing] = useState(false)
  const [mods, setMods] = useState([]) // every guide, so any can be added as a stage
  const [cats, setCats] = useState([])
  const [before, setBefore] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [pick, setPick] = useState('')
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [m, pw, pc] = await Promise.all([
        supabase.from('modules').select('id,title,role,mins,published').order('created_at'),
        isNew ? { data: blank } : supabase.from('pathways').select('*').eq('id', id).single(),
        supabase.from('pathways').select('category')
      ])
      if (!pw.data) return setMissing(true)
      const list = m.data || []
      setMods(list)
      setCats([...new Set([...list.map((x) => x.role), ...(pc.data || []).map((x) => x.category)].filter(Boolean))])
      setBefore(pw.data.before_you_begin.join('\n'))
      setOutcomes(pw.data.outcomes.join('\n'))
      // Drop stages whose guide has since been deleted.
      setP({ ...pw.data, module_ids: pw.data.module_ids.filter((x) => list.some((y) => y.id === x)) })
    })()
  }, [id, isNew])

  if (missing) return <p>We couldn’t find that pathway. <Link to="/admin/pathways">Back to pathways</Link></p>
  if (!p) return <p>Loading…</p>

  const set = (patch) => setP((prev) => ({ ...prev, ...patch }))
  const byId = Object.fromEntries(mods.map((m) => [m.id, m]))
  const available = mods.filter((m) => !p.module_ids.includes(m.id))

  const move = (i, d) => {
    const a = [...p.module_ids]
    const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    set({ module_ids: a })
  }
  const drop = (to) => {
    if (drag !== null && drag !== to) {
      const a = [...p.module_ids]
      const [x] = a.splice(drag, 1)
      a.splice(to, 0, x)
      set({ module_ids: a })
    }
    setDrag(null); setOver(null)
  }
  const add = () => { if (pick) { set({ module_ids: [...p.module_ids, pick] }); setPick('') } }

  async function save() {
    if (!p.title.trim()) return alert('Add a title.')
    if (!p.category.trim()) return alert('Choose a category, or create a new one.')
    setBusy(true)
    const payload = {
      title: p.title.trim(), category: p.category.trim(), summary: p.summary.trim(),
      description: p.description.trim(), level: p.level,
      before_you_begin: lines(before), outcomes: lines(outcomes),
      project_title: p.project_title.trim(), project_text: p.project_text.trim(),
      module_ids: p.module_ids, published: p.published, updated_at: new Date().toISOString()
    }
    const { error } = isNew
      ? await supabase.from('pathways').insert(payload)
      : await supabase.from('pathways').update(payload).eq('id', id)
    setBusy(false)
    error ? alert(error.message) : nav('/admin/pathways')
  }

  return (
    <>
      <Link to="/admin/pathways">Back to pathways</Link>
      <div className="row">
        <h1>{isNew ? 'New pathway' : 'Edit pathway'}</h1>
        {!isNew && <Link className="btn" to={`/p/${id}`}>View roadmap</Link>}
      </div>

      <div className="panel">
        <label>Title</label><input value={p.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} />
        <label>Category</label>
        <CategoryPicker value={p.category} options={cats} onChange={(category) => set({ category })} />
        <label>One-line summary</label><input value={p.summary} maxLength={200} onChange={(e) => set({ summary: e.target.value })} />
        <label>Description</label><textarea rows={4} value={p.description} onChange={(e) => set({ description: e.target.value })} />
        <label>Level</label>
        <select value={p.level} onChange={(e) => set({ level: e.target.value })}>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <h2>Stages</h2>
      <p className="muted">Each stage is one guide. Drag to reorder, or use the arrows. Learners see the stages in this order.</p>
      {p.module_ids.length === 0 && <p className="muted">No stages yet. Add a guide below.</p>}
      <ol className="stages-edit">
        {p.module_ids.map((mid, i) => {
          const m = byId[mid]
          return (
            <li key={mid} draggable className={over === i ? 'over' : ''}
              onDragStart={() => setDrag(i)} onDragOver={(e) => { e.preventDefault(); setOver(i) }}
              onDrop={() => drop(i)} onDragEnd={() => { setDrag(null); setOver(null) }}>
              <span className="grip" aria-hidden="true"><GripVertical size={16} /></span>
              <span className="num">{i + 1}</span>
              <span className="grow">
                <b>{m.title}</b> <span className="muted">{m.role}, {m.mins} min{m.published ? '' : ', draft (hidden from learners)'}</span>
              </span>
              <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
              <button aria-label="Move down" disabled={i === p.module_ids.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
              <button className="danger" onClick={() => set({ module_ids: p.module_ids.filter((x) => x !== mid) })}>Remove</button>
            </li>
          )
        })}
      </ol>
      {available.length > 0 ? (
        <div className="cat-row">
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Guide to add">
            <option value="">Add a guide…</option>
            {available.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.role})</option>)}
          </select>
          <button className="primary" disabled={!pick} onClick={add}>Add stage</button>
        </div>
      ) : (
        <p className="muted">{mods.length === 0 ? 'Create some guides first, then add them here.' : 'Every guide is already in this pathway.'}</p>
      )}

      <h2 style={{ marginTop: 24 }}>Extras (optional)</h2>
      <div className="panel">
        <label>Before you begin (one item per line)</label>
        <textarea rows={4} value={before} onChange={(e) => setBefore(e.target.value)} />
        <label>You’ll leave able to (one item per line)</label>
        <textarea rows={4} value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
        <label>Final project title</label>
        <input value={p.project_title} maxLength={120} onChange={(e) => set({ project_title: e.target.value })} />
        <label>Final project brief</label>
        <textarea rows={5} value={p.project_text} onChange={(e) => set({ project_text: e.target.value })} />
      </div>

      <label className="check"><input type="checkbox" checked={p.published} onChange={(e) => set({ published: e.target.checked })} /> Published (visible to learners)</label>
      <div className="row"><span /><button className="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save pathway'}</button></div>
    </>
  )
}
