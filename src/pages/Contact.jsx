import { useState } from 'react'
import { Link } from 'react-router-dom'

// Messages are emailed to you by Web3Forms. The access key is public by design: it only forwards
// to the inbox you registered, and your address is never shown to visitors or in this code.
const KEY = import.meta.env.VITE_WEB3FORMS_KEY

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '' })
  const [trap, setTrap] = useState('') // hidden field: real people leave it empty, bots fill it in
  const [state, setState] = useState('idle') // idle | sending | done | error | off
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (trap) return setState('done')
    if (!KEY) {
      console.warn('VITE_WEB3FORMS_KEY is not set, so the contact form cannot send.')
      return setState('off')
    }
    setState('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: KEY,
          subject: 'New message from Akamata',
          from_name: 'Akamata',
          name: f.name.trim(),
          email: f.email.trim(),
          message: f.message.trim()
        })
      })
      const data = await res.json()
      setState(data.success ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="panel">
        <h1>Thanks for getting in touch</h1>
        <p className="muted">Your message is on its way. We’ll reply to {f.email.trim()}.</p>
        <div className="row"><span /><Link className="btn primary" to="/">Back to the roadmaps</Link></div>
      </div>
    )
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h1>Get in touch</h1>
      <p className="muted">Questions, ideas or feedback? Send us a message.</p>

      <label htmlFor="c-name">Your name <span className="req">*</span></label>
      <input id="c-name" required maxLength={80} autoComplete="name" value={f.name} onChange={set('name')} />

      <label htmlFor="c-email">Your email <span className="req">*</span></label>
      <input id="c-email" type="email" required maxLength={254} autoComplete="email" value={f.email} onChange={set('email')} />
      <p className="hint">We’ll only use this to reply to you.</p>

      <label htmlFor="c-msg">Message <span className="req">*</span></label>
      <textarea id="c-msg" rows={7} required minLength={5} maxLength={2000} value={f.message} onChange={set('message')} />
      <p className="hint">{f.message.length} / 2000</p>

      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={trap} onChange={(e) => setTrap(e.target.value)} />

      {state === 'error' && <p role="alert">We couldn’t send that. Please check your connection and try again.</p>}
      {state === 'off' && <p role="alert">The contact form isn’t available right now. Please try again later.</p>}
      <div className="row"><span /><button className="primary" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : 'Send message'}</button></div>
    </form>
  )
}
