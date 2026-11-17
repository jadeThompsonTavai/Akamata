import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

export default function Suggest() {
  const { session } = useAuth()
  const [params] = useSearchParams()
  const [f, setF] = useState({ email: '', subject: params.get('subject') || '', notes: '' })
  const [trap, setTrap] = useState('') // hidden field: real people leave it empty, bots fill it in
  const [state, setState] = useState('idle') // idle | sending | done | error
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    if (session?.user.email) setF((p) => (p.email ? p : { ...p, email: session.user.email }))
  }, [session])

  async function submit(e) {
    e.preventDefault()
    if (trap) return setState('done')
    setState('sending')
    const { error } = await supabase.from('requests').insert({
      email: f.email.trim(),
      subject: f.subject.trim(),
      notes: f.notes.trim() || null
    })
    // 23505 = this person already asked for this, which is fine from their side.
    setState(error && error.code !== '23505' ? 'error' : 'done')
  }

  if (state === 'done') {
    return (
      <div className="panel">
        <h1>Thank you</h1>
        <p className="muted">Your request is in. If we release it, we’ll email {f.email.trim()}.</p>
        <div className="row">
          <button onClick={() => { setF({ email: f.email, subject: '', notes: '' }); setState('idle') }}>Suggest another</button>
          <Link className="btn primary" to="/">Back to the roadmaps</Link>
        </div>
      </div>
    )
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h1>Suggest a roadmap</h1>
      <p className="muted">Tell us what you’d like to learn next, and we’ll email you if it’s released.</p>

      <label htmlFor="s-email">Your email <span className="req">*</span></label>
      <input id="s-email" type="email" required maxLength={254} autoComplete="email" value={f.email} onChange={set('email')} />
      <p className="hint">We’ll only use this to tell you when it’s ready.</p>

      <label htmlFor="s-subject">What would you like to learn? <span className="req">*</span></label>
      <input id="s-subject" required minLength={2} maxLength={120} placeholder="For example: forklift safety, or Xero basics" value={f.subject} onChange={set('subject')} />

      <label htmlFor="s-notes">Anything specific you want to know? (optional)</label>
      <textarea id="s-notes" rows={6} maxLength={1000} value={f.notes} onChange={set('notes')} />
      <p className="hint">{f.notes.length} / 1000</p>

      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} />

      {state === 'error' && <p role="alert">We couldn’t save that. Please check your connection and try again.</p>}
      <div className="row"><span /><button className="primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send request'}</button></div>
    </form>
  )
}
