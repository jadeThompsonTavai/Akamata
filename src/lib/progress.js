import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from './useAuth'

// Guests: progress lives in localStorage. Signed in: it syncs to Supabase.
// On sign-in, guest progress is pushed up first so nothing is lost.
const KEY = 'akamata-progress'
const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const writeLocal = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* storage unavailable */ } }

export function useProgress() {
  const { session } = useAuth()
  const [progress, setProgress] = useState(readLocal)

  useEffect(() => {
    if (!session) return
    ;(async () => {
      const rows = Object.entries(readLocal()).map(([module_id, v]) => ({
        user_id: session.user.id, module_id, step: v.step, done: v.done
      }))
      if (rows.length) await supabase.from('progress').upsert(rows)
      const { data } = await supabase.from('progress').select('module_id, step, done')
      const merged = {}
      ;(data || []).forEach((r) => { merged[r.module_id] = { step: r.step, done: r.done } })
      setProgress(merged)
      writeLocal(merged)
    })()
  }, [session])

  const save = useCallback(async (moduleId, step, done) => {
    setProgress((prev) => {
      const next = { ...prev, [moduleId]: { step, done } }
      writeLocal(next)
      return next
    })
    if (session) {
      await supabase.from('progress').upsert({
        user_id: session.user.id, module_id: moduleId, step, done,
        updated_at: new Date().toISOString()
      })
    }
  }, [session])

  return [progress, save]
}
