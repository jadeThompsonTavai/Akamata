import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useProgress } from '../lib/progress'

export default function Module() {
  const { id } = useParams()
  const [m, setM] = useState(null)
  const [error, setError] = useState(false)
  const [picked, setPicked] = useState(null)
  const [progress, save] = useProgress()
  const [params] = useSearchParams()
  const pid = params.get('p') // set when this guide is opened as a stage of a roadmap
  const [path, setPath] = useState(null)
  const [next, setNext] = useState(null)

  useEffect(() => {
    supabase.from('modules').select('*').eq('id', id).single()
      .then(({ data, error }) => (error ? setError(true) : setM(data)))
  }, [id])

  useEffect(() => {
    if (!pid) return
    supabase.from('pathways').select('id,title,module_ids').eq('id', pid).single().then(async ({ data }) => {
      const at = data ? data.module_ids.indexOf(id) : -1
      if (at < 0) return
      setPath({ id: data.id, title: data.title })
      const rest = data.module_ids.slice(at + 1)
      if (!rest.length) return
      const { data: found } = await supabase.from('modules').select('id').in('id', rest)
      const ok = new Set((found || []).map((r) => r.id))
      setNext(rest.find((x) => ok.has(x)) || null)
    })
  }, [pid, id])

  if (error) return <p>We couldn’t find that guide. <Link to="/">Back to the library</Link></p>
  if (!m) return <p>Loading…</p>

  const n = m.steps.length + (m.quiz ? 1 : 0)
  const cur = progress[id] || { step: 0, done: false }

  if (cur.done && cur.step >= n) {
    return (
      <div className="panel">
        <h1>Guide complete</h1>
        <p className="muted">{m.title}</p>
        <div className="row">
          <button onClick={() => save(id, 0, true)}>Review again</button>
          <span>
            <Link className="btn" to={path ? `/p/${path.id}` : '/'}>{path ? 'Back to the roadmap' : 'Back to the library'}</Link>{' '}
            {next && <Link className="btn primary" to={`/m/${next}?p=${path.id}`}>Next stage</Link>}
          </span>
        </div>
      </div>
    )
  }

  const i = Math.min(cur.step, n - 1)
  const move = (d) => {
    setPicked(null)
    const next = i + d
    next >= n ? save(id, n, true) : save(id, Math.max(0, next), cur.done)
  }

  return (
    <>
      <Link to={path ? `/p/${path.id}` : '/'}>{path ? `Back to ${path.title}` : 'Back to the library'}</Link>
      <h1>{m.title}</h1>
      <div className="bar"><i style={{ width: `${Math.round((i / n) * 100)}%` }} /></div>
      <p className="muted">Step {i + 1} of {n}</p>
      <div className="panel body">
        {i < m.steps.length ? (
          <>
            <h2>{m.steps[i].t}</h2>
            {m.steps[i].video && (
              <video key={m.steps[i].video} controls preload="metadata" playsInline src={m.steps[i].video} className="preview" />
            )}
            <ReactMarkdown>{m.steps[i].b}</ReactMarkdown>
          </>
        ) : (
          <>
            <h2>Quick check</h2>
            <p>{m.quiz.q}</p>
            {m.quiz.o.map((o, k) => (
              <button
                key={k} disabled={picked !== null}
                className={'opt' + (picked !== null && k === m.quiz.a ? ' ok' : picked === k ? ' no' : '')}
                onClick={() => setPicked(k)}
              >{o}</button>
            ))}
            {picked !== null && <p>{picked === m.quiz.a ? 'Correct.' : 'Not quite. The right answer is highlighted.'}</p>}
          </>
        )}
      </div>
      <div className="row">
        <button disabled={i === 0} onClick={() => move(-1)}>Back</button>
        {(i < m.steps.length || picked !== null) && (
          <button className="primary" onClick={() => move(1)}>{i === n - 1 ? 'Finish' : 'Next'}</button>
        )}
      </div>
    </>
  )
}
