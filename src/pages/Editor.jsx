import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { mediaPathsIn, removeMedia } from '../lib/media'

const MAX_VIDEO_MB = 50 // keep in step with the bucket limit in supabase/schema.sql
const blank = { title: '', role: '', summary: '', mins: 5, steps: [{ t: '', b: '' }], quiz: null, published: false }

export default function Editor() {
  const { id } = useParams()
  const isNew = id === 'new'
  const nav = useNavigate()
  const [m, setM] = useState(isNew ? blank : null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(null) // index of the step being uploaded to
  const original = useRef(new Set()) // files the guide used when it was opened
  const uploaded = useRef([]) // files uploaded during this edit session
  const [cats, setCats] = useState([]) // categories already used by existing guides
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState('')

  useEffect(() => {
    if (!isNew) {
      supabase.from('modules').select('*').eq('id', id).single().then(({ data }) => {
        original.current = mediaPathsIn(data.steps)
        setM(data)
      })
    }
  }, [id, isNew])

  useEffect(() => {
    supabase.from('modules').select('role').then(({ data }) => {
      setCats([...new Set((data || []).map((r) => r.role).filter(Boolean))])
    })
  }, [])

  if (!m) return <p>Loading…</p>
  const set = (patch) => setM({ ...m, ...patch })
  const setStep = (i, patch) =>
    setM((p) => ({ ...p, steps: p.steps.map((s, k) => (k === i ? { ...s, ...patch } : s)) }))
  const quiz = m.quiz || { q: '', o: ['', '', ''], a: 0 }
  const options = [...new Set([...cats, m.role].filter(Boolean))].sort((a, b) => a.localeCompare(b))

  function addCategory() {
    const name = newCat.trim()
    if (!name) return
    const existing = options.find((c) => c.toLowerCase() === name.toLowerCase()) // reuse, don't duplicate
    const chosen = existing || name
    if (!existing) setCats((c) => [...c, chosen])
    set({ role: chosen })
    setNewCat('')
    setAdding(false)
  }

  async function addImage(i, file) {
    if (!file) return
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (error) return alert(`Upload failed: ${error.message}`)
    uploaded.current.push(path)
    const { data } = supabase.storage.from('media').getPublicUrl(path)
    setM((p) => ({
      ...p,
      steps: p.steps.map((s, k) => (k === i ? { ...s, b: `${s.b}\n\n![](${data.publicUrl})` } : s))
    }))
  }

  async function addVideo(i, file) {
    if (!file) return
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      return alert(`That video is over ${MAX_VIDEO_MB} MB. Trim or compress it, then try again.`)
    }
    setUploading(i)
    const path = `video-${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`
    const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
    setUploading(null)
    if (error) return alert(`Upload failed: ${error.message}`)
    uploaded.current.push(path)
    setStep(i, { video: supabase.storage.from('media').getPublicUrl(path).data.publicUrl })
  }

  async function save() {
    if (!m.title.trim() || m.steps.length === 0) return alert('Add a title and at least one step.')
    if (!m.role.trim()) return alert('Choose a category, or create a new one.')
    if (m.steps.some((s) => !s.b.trim() && !s.video)) return alert('Each step needs article text, a video, or both.')
    setBusy(true)
    const opts = quiz.o.filter((o) => o.trim())
    const payload = {
      title: m.title, role: m.role.trim(), summary: m.summary, mins: +m.mins || 5,
      steps: m.steps, published: m.published, updated_at: new Date().toISOString(),
      quiz: quiz.q.trim() && opts.length > 1 ? { q: quiz.q, o: opts, a: Math.min(quiz.a, opts.length - 1) } : null
    }
    const { error } = isNew
      ? await supabase.from('modules').insert(payload)
      : await supabase.from('modules').update(payload).eq('id', id)
    if (error) { setBusy(false); return alert(error.message) }
    // Delete files the saved guide no longer uses: removed steps, replaced videos, unused uploads.
    const keep = mediaPathsIn(m.steps)
    await removeMedia([...original.current, ...uploaded.current].filter((p) => !keep.has(p)))
    setBusy(false)
    nav('/admin')
  }

  return (
    <>
      <Link to="/admin" onClick={() => removeMedia(uploaded.current)}>Back to all guides</Link>
      <h1>{isNew ? 'New guide' : 'Edit guide'}</h1>
      <div className="panel">
        <label>Title</label><input value={m.title} onChange={(e) => set({ title: e.target.value })} />
        <label htmlFor="e-cat">Category</label>
        {adding ? (
          <div className="cat-row">
            <input id="e-cat" autoFocus maxLength={60} placeholder="New category name" value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }} />
            <button className="primary" onClick={addCategory}>Add</button>
            <button className="ghost" onClick={() => { setAdding(false); setNewCat('') }}>Cancel</button>
          </div>
        ) : (
          <div className="cat-row">
            <select id="e-cat" value={m.role} onChange={(e) => set({ role: e.target.value })}>
              <option value="" disabled>Choose a category</option>
              {options.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setAdding(true)}>New category</button>
          </div>
        )}
        <label>One-line summary</label><input value={m.summary} onChange={(e) => set({ summary: e.target.value })} />
        <label>Minutes to complete</label><input type="number" value={m.mins} onChange={(e) => set({ mins: e.target.value })} />
      </div>

      <h2>Steps</h2>
      <p className="muted">Write in Markdown: blank line for a new paragraph, “- ” for bullets, **bold** for emphasis.</p>
      {m.steps.map((s, i) => (
        <div className="panel" key={i}>
          <label>Step {i + 1} title</label><input value={s.t} onChange={(e) => setStep(i, { t: e.target.value })} />
          <label>Video (optional)</label>
          {s.video && (
            <div>
              <video controls preload="metadata" playsInline src={s.video} className="preview" />
              <button className="danger" onClick={() => setStep(i, { video: null })}>Remove video</button>
            </div>
          )}
          <label className="btn">
            {uploading === i ? 'Uploading…' : s.video ? 'Replace video' : 'Upload video'}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" hidden
              disabled={uploading !== null} onChange={(e) => addVideo(i, e.target.files[0])} />
          </label>
          <label>Article text</label><textarea value={s.b} onChange={(e) => setStep(i, { b: e.target.value })} />
          <div className="row">
            <label className="btn">Add image<input type="file" accept="image/*" hidden onChange={(e) => addImage(i, e.target.files[0])} /></label>
            <button className="danger" onClick={() => set({ steps: m.steps.filter((_, k) => k !== i) })}>Remove step</button>
          </div>
        </div>
      ))}
      <button onClick={() => set({ steps: [...m.steps, { t: '', b: '' }] })}>Add step</button>

      <h2>Quick check (optional)</h2>
      <div className="panel">
        <label>Question</label><input value={quiz.q} onChange={(e) => set({ quiz: { ...quiz, q: e.target.value } })} />
        {quiz.o.map((o, k) => (
          <div key={k}>
            <label>Option {k + 1}</label>
            <input value={o} onChange={(e) => set({ quiz: { ...quiz, o: quiz.o.map((x, j) => (j === k ? e.target.value : x)) } })} />
          </div>
        ))}
        <label>Correct option</label>
        <select value={quiz.a} onChange={(e) => set({ quiz: { ...quiz, a: +e.target.value } })}>
          {quiz.o.map((_, k) => <option key={k} value={k}>Option {k + 1}</option>)}
        </select>
      </div>

      <label className="check"><input type="checkbox" checked={m.published} onChange={(e) => set({ published: e.target.checked })} /> Published (visible to learners)</label>
      <div className="row"><span /><button className="primary" disabled={busy || uploading !== null} onClick={save}>{busy ? 'Saving…' : 'Save guide'}</button></div>
    </>
  )
}
