import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'

export default function Account() {
  const { session, profile } = useAuth()
  const nav = useNavigate()
  const [mode, setMode] = useState('up')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    const { error } = mode === 'up'
      ? await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { name: f.name } } })
      : await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
    if (error) return setMsg(error.message)
    if (mode === 'up') setMsg('Check your email to confirm your account, then sign in.')
    else nav('/')
  }

  if (session) {
    return (
      <div className="panel">
        <h1>Hi {profile?.name || 'there'}</h1>
        <p className="muted">{session.user.email}</p>
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h1>{mode === 'up' ? 'Save your progress' : 'Sign in'}</h1>
      <p className="muted">Optional. You can keep learning without an account.</p>
      {mode === 'up' && (<><label>Name</label><input value={f.name} onChange={set('name')} required /></>)}
      <label>Email</label><input type="email" value={f.email} onChange={set('email')} required />
      <label>Password</label><input type="password" minLength={8} value={f.password} onChange={set('password')} required />
      {msg && <p role="alert">{msg}</p>}
      <div className="row">
        <button type="button" className="ghost" onClick={() => setMode(mode === 'up' ? 'in' : 'up')}>
          {mode === 'up' ? 'I already have an account' : 'Create an account'}
        </button>
        <button className="primary">{mode === 'up' ? 'Create account' : 'Sign in'}</button>
      </div>
    </form>
  )
}
