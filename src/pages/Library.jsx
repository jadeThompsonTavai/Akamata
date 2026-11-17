import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowDown, ArrowUpRight, BookOpen, Footprints, Hammer, Megaphone, PenTool,
  Route as PathIcon, Search, ShieldCheck, Sprout, Table, Users
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProgress } from '../lib/progress'
import { fmtTime, pathStats } from '../lib/format'
import { HeroArt } from '../components/Art'

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
  const [paths, setPaths] = useState(null)
  const [error, setError] = useState('')
  const [role, setRole] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('recommended')
  const [heroImg, setHeroImg] = useState(true)
  const search = useRef(null)

  useEffect(() => {
    Promise.all([
      supabase.from('modules').select('id,title,role,summary,mins,steps,quiz').eq('published', true).order('created_at'),
      supabase.from('pathways').select('id,title,category,summary,level,module_ids').eq('published', true).order('created_at')
    ]).then(([m, p]) => {
      if (m.error) return setError('Couldn’t load roadmaps. Check your connection and try again.')
      setModules(m.data)
      setPaths(p.error ? [] : p.data) // the page still works before the pathways table exists
    })
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

  // Roadmaps (pathways) first, then any guides that aren't part of a roadmap.
  const items = useMemo(() => {
    if (!modules || !paths) return null
    const byId = Object.fromEntries(modules.map((m) => [m.id, m]))
    const inPath = new Set()
    const roadmaps = paths.map((pw) => {
      const st = pathStats(pw, byId, progress)
      if (!st.mods.length) return null
      st.mods.forEach((m) => inPath.add(m.id))
      return {
        key: 'p' + pw.id, to: `/p/${pw.id}`, title: pw.title, role: pw.category, summary: pw.summary, mins: st.mins,
        meta: `${st.mods.length} ${st.mods.length === 1 ? 'stage' : 'stages'} · ${fmtTime(st.mins)} · ${pw.level}`,
        pct: Math.round((st.done / st.mods.length) * 100)
      }
    }).filter(Boolean)
    const guides = modules.filter((m) => !inPath.has(m.id)).map((m) => {
      const p = progress[m.id], n = m.steps.length + (m.quiz ? 1 : 0)
      return {
        key: 'm' + m.id, to: `/m/${m.id}`, title: m.title, role: m.role, summary: m.summary, mins: m.mins,
        meta: `${m.steps.length} steps · ${m.mins} min`,
        pct: p ? (p.done ? 100 : Math.round((p.step / n) * 100)) : 0
      }
    })
    return [...roadmaps, ...guides]
  }, [modules, paths, progress])

  const roles = useMemo(() => {
    const counts = {}
    ;(items || []).forEach((it) => { counts[it.role] = (counts[it.role] || 0) + 1 })
    return counts
  }, [items])

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase()
    const list = (items || []).filter((it) =>
      (role === 'All' || it.role === role) &&
      (!term || `${it.title} ${it.summary} ${it.role}`.toLowerCase().includes(term)))
    if (sort === 'short') list.sort((a, b) => a.mins - b.mins)
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    return list
  }, [items, role, q, sort])

  const first = items?.[0]
  const count = items?.length || 0

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
        {!error && !items && <p className="muted">Loading roadmaps…</p>}
        {items && shown.length === 0 && (
          <p className="muted">Nothing matches yet. <Link to={`/suggest${q.trim() ? `?subject=${encodeURIComponent(q.trim())}` : ''}`}>Suggest it as a roadmap</Link>.</p>
        )}
        <div className="grid">
          {shown.map((it) => {
            const Icon = iconFor(it.role), feat = it.key === first?.key
            return (
              <Link key={it.key} to={it.to} className={'card' + (feat ? ' feat' : '')}>
                <div className="card-top">
                  <span className="cat"><Icon size={14} /> {it.role}</span>
                  {feat && <span className="badge">Good first step</span>}
                </div>
                <h2>{it.title}</h2>
                <p className="muted">{it.summary}</p>
                <div className="card-foot">
                  <span>{it.meta}{it.pct === 100 ? ' · Complete' : it.pct > 0 ? ` · ${it.pct}%` : ''}</span>
                  <ArrowUpRight size={15} />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="grid-foot">
          <span className="muted">{count} thoughtfully mapped {count === 1 ? 'path' : 'paths'}. More beginnings on the way.</span>
          <Link to="/suggest">Missing your next step? Suggest a roadmap <ArrowUpRight size={12} /></Link>
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
          <Link to={first ? first.to : '/#roadmaps'} className="btn-dark">Take the first step <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </>
  )
}
