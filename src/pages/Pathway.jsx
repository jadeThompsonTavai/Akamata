import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, Check, Sprout } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProgress } from '../lib/progress'
import { fmtTime } from '../lib/format'

export default function Pathway() {
  const { id } = useParams()
  const [pw, setPw] = useState(null)
  const [mods, setMods] = useState([])
  const [error, setError] = useState(false)
  const [progress] = useProgress()

  useEffect(() => {
    supabase.from('pathways').select('*').eq('id', id).single().then(async ({ data, error }) => {
      if (error || !data) return setError(true)
      const { data: ms } = data.module_ids.length
        ? await supabase.from('modules').select('id,title,role,mins,steps,quiz').in('id', data.module_ids)
        : { data: [] }
      const byId = Object.fromEntries((ms || []).map((m) => [m.id, m]))
      setMods(data.module_ids.map((x) => byId[x]).filter(Boolean))
      setPw(data)
    })
  }, [id])

  if (error) return <div className="in"><p>We couldn’t find that roadmap. <Link to="/">Back to all roadmaps</Link></p></div>
  if (!pw) return <div className="in"><p>Loading…</p></div>

  const isDone = (m) => !!progress[m.id]?.done
  const done = mods.filter(isDone).length
  const cur = mods.findIndex((m) => !isDone(m)) // first stage not yet finished, -1 when all done
  const mins = mods.reduce((a, m) => a + m.mins, 0)
  const target = mods[cur >= 0 ? cur : 0]
  const hasProject = !!(pw.project_title || pw.project_text)
  const hasBefore = pw.before_you_begin.length > 0
  const num = (i) => String(i + 1).padStart(2, '0')

  return (
    <div className="pw-page">
      <div className="in">
        <div className="crumbs">
          <Link to="/#roadmaps">All roadmaps</Link><span>/</span><span>{pw.category}</span><span>/</span><span>{pw.title}</span>
        </div>

        <section className="pw-hero">
          <div>
            <div className="pills"><span className="pill-tag">{pw.category}</span><span className="pill-tag">{pw.level}</span></div>
            <h1>{pw.title}</h1>
            {pw.summary && <p className="pw-sum">{pw.summary}</p>}
            {pw.description && <p className="pw-desc">{pw.description}</p>}
            <div className="pw-meta">
              <span>{mods.length} {mods.length === 1 ? 'stage' : 'stages'}</span>
              <span>{fmtTime(mins)}</span>
              <span>Self-paced</span>
            </div>
            {target && (
              <Link className="btn-dark" to={`/m/${target.id}?p=${pw.id}`}>
                {done > 0 && done < mods.length ? 'Continue this roadmap' : done === mods.length ? 'Review this roadmap' : 'Start this roadmap'} <ArrowUpRight size={15} />
              </Link>
            )}
            <p className="fine">Free to follow. No account needed. Updated {new Date(pw.updated_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.</p>
          </div>
          {hasProject && (
            <aside className="pw-card">
              <span className="eyebrow">Final project</span>
              <h3>{pw.project_title || 'Make something real'}</h3>
              {pw.project_text && <p>{pw.project_text}</p>}
              <a className="link" href="#project">See the brief <ArrowUpRight size={14} /></a>
            </aside>
          )}
        </section>
      </div>

      <div className="tabs">
        <div className="in">
          <nav>
            <a href="#path">The learning path</a>
            {hasProject && <a href="#project">Your final project</a>}
            {hasBefore && <a href="#before">Before you begin</a>}
          </nav>
          <div className="prog"><span>{done}/{mods.length} stages</span><div className="bar"><i style={{ width: `${mods.length ? (done / mods.length) * 100 : 0}%` }} /></div></div>
        </div>
      </div>

      <div className="in pw-body">
        <section id="path">
          <span className="eyebrow">Your next small steps</span>
          <h2 className="how-title">A clear path. One stage at a time.</h2>
          <p className="muted" style={{ margin: '8px 0 24px' }}>Work through each stage in order. Every stage is a short guide you can finish in one sitting.</p>
          {mods.length === 0 && <p className="muted">The stages for this roadmap are on their way.</p>}
          {mods.map((m, i) => {
            const d = isDone(m), isCur = i === cur
            return (
              <Link key={m.id} id={`stage-${m.id}`} to={`/m/${m.id}?p=${pw.id}`} className={'stage' + (isCur ? ' cur' : '') + (d ? ' done' : '')}>
                <div className="stage-head">
                  <span className="stage-num">{d ? <Check size={15} /> : num(i)}</span>
                  <div><span className="cat">{m.role}</span><h3>{m.title}</h3></div>
                  <div className="stage-meta">
                    {isCur && <span className="badge">Start here</span>}
                    <span>{m.mins} min · {m.steps.length} {m.steps.length === 1 ? 'lesson' : 'lessons'}</span>
                  </div>
                </div>
                <ul className="lessons">
                  {m.steps.map((s, k) => <li key={k}><span className="dot" />{s.t}</li>)}
                </ul>
                {m.quiz && <div className="trial"><b>Quick check</b>Test what you’ve learned before you move on.</div>}
                <div className="stage-foot">
                  <span>{d ? 'Complete' : ''}</span>
                  <span>{isCur ? 'Begin stage' : d ? 'Review' : 'Open stage'} →</span>
                </div>
              </Link>
            )
          })}
          {mods.length > 0 && <p className="pw-end"><Sprout size={15} /> You don’t have to do it all today. Just take the next step.</p>}
        </section>

        <aside className="pw-side">
          {hasBefore && (
            <div id="before" className="side-card">
              <span className="eyebrow">Before you begin</span>
              <h3>Curiosity is enough to start.</h3>
              <ul className="ticks">{pw.before_you_begin.map((t, i) => <li key={i}><Check size={14} />{t}</li>)}</ul>
              {hasProject && <a className="btn-dark" href="#project">Get the project brief</a>}
            </div>
          )}
          {mods.length > 0 && (
            <div>
              <span className="eyebrow">Your map through</span>
              <ol className="map">
                {mods.map((m, i) => (
                  <li key={m.id} className={i === cur ? 'cur' : ''}><a href={`#stage-${m.id}`}><span>{num(i)}</span>{m.title}</a></li>
                ))}
              </ol>
            </div>
          )}
          {pw.outcomes.length > 0 && (
            <div>
              <span className="eyebrow">You’ll leave able to</span>
              <ul className="ticks" style={{ marginTop: 10 }}>{pw.outcomes.map((t, i) => <li key={i}><Check size={14} />{t}</li>)}</ul>
            </div>
          )}
        </aside>
      </div>

      {hasProject && (
        <div className="in">
          <section id="project" className="proj">
            <span className="eyebrow">Your final project</span>
            <h2 className="how-title">{pw.project_title || 'Make something real'}</h2>
            <p style={{ maxWidth: 640, whiteSpace: 'pre-wrap' }}>{pw.project_text}</p>
          </section>
        </div>
      )}
    </div>
  )
}
