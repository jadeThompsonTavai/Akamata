import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { supabase } from '../lib/supabase'
import { useProgress } from '../lib/progress'

export default function Module() {
  const { id } = useParams()
  const [m, setM] = useState(null)
  const [error, setError] = useState(false)
  const [picked, setPicked] = useState(null)
  const [progress, save] = useProgress()

  useEffect(() => {
    supabase.from('modules').select('*').eq('id', id).single()
      .then(({ data, error }) => (error ? setError(true) : setM(data)))
  }, [id])

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
          <Link className="btn primary" to="/">Back to the library</Link>
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
      <Link to="/">Back to the library</Link>
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
