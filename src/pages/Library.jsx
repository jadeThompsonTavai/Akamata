import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowDown, ArrowUpRight, BookOpen, Footprints, Hammer, Megaphone, PenTool,
  Route as PathIcon, Search, ShieldCheck, Sprout, Table, Users
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProgress } from '../lib/progress'
import { HeroArt } from '../components/Art'
import { CONTACT } from '../config'

const ICONS = [
  [/market|ads|seo|content/i, Megaphone],
  [/data|tool|sheet|analytic/i, Table],
  [/design|ux|figma/i, PenTool],
  [/people|work|team|manage|lead/i, Users],
  [/safety|health|hazard/i, ShieldCheck]
]
const iconFor = (role) => (ICONS.find(([re]) => re.test(role)) || [null, BookOpen])[1]

export default function Library() {
  const [progress] = useProgress()
  const { hash, key } = useLocation()
  const [modules, setModules] = useState(null)
  const [error, setError] = useState('')
  const [role, setRole] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recommended')
  const [heroImg, setHeroImg] = useState(true)
  const search = useRef(null)

  useEffect(() => {
    supabase.from('modules').select('id,title,role,summary,mins,steps,quiz')
      .eq('published', true).order('created_at')
      .then(({ data, error }) => (error ? setError('Couldn’t load roadmaps. Check your connection and try again.') : setModules(data)))
  }, [])

  // Scroll to #roadmaps / #how when arriving from another page or clicking a nav link.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }, [hash, key])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.current?.focus() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const roles = useMemo(() => {
    const counts = {}
    ;(modules || []).forEach((m) => { counts[m.role] = (counts[m.role] || 0) + 1 })
    return counts
  }, [modules])

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = (modules || []).filter((m) =>
      (role === 'All' || m.role === role) &&
      (!term || `${m.title} ${m.summary} ${m.role}`.toLowerCase().includes(term)))
    if (sort === 'short') list.sort((a, b) => a.mins - b.mins)
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    return list
  }, [modules, role, q, sort])

  const firstId = modules?.[0]?.id
  const pct = (m) => {
    const p = progress[m.id]; const n = m.steps.length + (m.quiz ? 1 : 0)
    return p ? (p.done ? 100 : Math.round((p.step / n) * 100)) : 0
  }
  const count = modules?.length || 0

  return (
    <>
      <section className="in hero">
        <div>
          <span className="eyebrow"><Sprout size={14} /> For the next chapter of you</span>
          <h1 className="display">A new skill.<br />A new beginning.</h1>
          <p className="lead">
            You don’t need to know everything. Just where to start. Find a practical roadmap,
            learn the essentials, and take your next step with a little more confidence.
          </p>
          <div className="cta-row">
            <Link to="/#roadmaps" className="btn-dark">Explore the roadmaps <ArrowUpRight size={15} /></Link>
            <Link to="/#how" className="link">How it works <ArrowDown size={14} /></Link>
          </div>
          <p className="fine">A clear path. Your own pace. No experience needed.</p>
        </div>
        <div className="art-wrap">
          <div className="hero-art">
            <HeroArt />
            {heroImg && <img src="/hero.jpg" alt="" onError={() => setHeroImg(false)} />}
          </div>
          <div className="float">
            <span className="fico"><ArrowUpRight size={14} /></span>
            <div><small>Start small, go further</small><b>One step is a beginning.</b></div>
          </div>
        </div>
      </section>

      <div className="band">
        <div className="in band-grid">
          <p className="band-title">Less searching.<br />More starting.</p>
          <div className="pt"><PathIcon size={16} /><div><b>A path, not a pile of links</b><span>The essentials, in the right order.</span></div></div>
          <div className="pt"><Hammer size={16} /><div><b>Learn by doing</b><span>Small projects. Real-world skills.</span></div></div>
          <div className="pt"><Footprints size={16} /><div><b>Progress at your pace</b><span>Make room for a little learning.</span></div></div>
        </div>
      </div>

      <section id="roadmaps" className="in sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Te Puna Ara · The spring of pathways</span>
            <h1>Te Puna Ara</h1>
            <p className="muted">A new role, a useful skill, or simply something you’ve been curious about.</p>
          </div>
          <label className="search">
            <Search size={15} />
            <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to learn?" aria-label="Search roadmaps" />
            <kbd>⌘K</kbd>
          </label>
        </div>

        <div className="filters">
          <div className="chips">
            <button className={'chip' + (role === 'All' ? ' on' : '')} onClick={() => setRole('All')}>All roadmaps <i>{count}</i></button>
            {Object.entries(roles).map(([r, n]) => (
              <button key={r} className={'chip' + (role === r ? ' on' : '')} onClick={() => setRole(r)}>{r} <i>{n}</i></button>
            ))}
          </div>
          <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort roadmaps">
            <option value="recommended">Sort by: Recommended</option>
            <option value="short">Sort by: Shortest first</option>
            <option value="az">Sort by: A to Z</option>
          </select>
        </div>

        {error && <p>{error}</p>}
        {!error && !modules && <p className="muted">Loading roadmaps…</p>}
        {modules && shown.length === 0 && <p className="muted">Nothing matches yet. Try a different word, or suggest a roadmap below.</p>}
        <div className="grid">
          {shown.map((m) => {
            const Icon = iconFor(m.role), p = pct(m), feat = m.id === firstId
            return (
              <Link key={m.id} to={`/m/${m.id}`} className={'card' + (feat ? ' feat' : '')}>
                <div className="card-top">
                  <span className="cat"><Icon size={14} /> {m.role}</span>
                  {feat && <span className="badge">Good first step</span>}
                </div>
                <h2>{m.title}</h2>
                <p className="muted">{m.summary}</p>
                <div className="card-foot">
                  <span>{m.steps.length} steps · {m.mins} min{p === 100 ? ' · Complete' : p > 0 ? ` · ${p}%` : ''}</span>
                  <ArrowUpRight size={15} />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid-foot">
          <span className="muted">{count} thoughtfully mapped {count === 1 ? 'path' : 'paths'}. More beginnings on the way.</span>
          <a href={CONTACT}>Missing your next step? Suggest a roadmap <ArrowUpRight size={12} /></a>
        </div>
      </section>

      <section id="how" className="in how">
        <div>
          <span className="eyebrow">Small steps, real skills</span>
          <h2 className="how-title">A little structure.<br />A lot of possibility.</h2>
        </div>
        <div className="steps">
          <div><span className="num">01</span><b>Find your direction</b><p className="muted">Choose a skill that feels useful to you. Every roadmap begins with the basics.</p></div>
          <div><span className="num">02</span><b>Follow the small steps</b><p className="muted">Work through clear stages, useful resources, and bite-sized practice.</p></div>
          <div><span className="num">03</span><b>Make something real</b><p className="muted">Finish with a practical project you can use, share, or build on at work.</p></div>
        </div>
      </section>

      <div className="in">
        <div className="cta">
          <div>
            <h2>You don’t have to see the whole path to begin.</h2>
            <p className="muted">That’s the spirit of Akamata. A welcoming place to start again, try something new, and grow.</p>
          </div>
          <Link to={firstId ? `/m/${firstId}` : '/#roadmaps'} className="btn-dark">Take the first step <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </>
  )
}
