import { supabase } from './supabase'

// Finds the storage files a guide uses (step videos and Markdown images)
// so they can be deleted when the guide, step or file is removed.
const MARK = '/storage/v1/object/public/media/'

const pathOf = (url) => {
  const i = typeof url === 'string' ? url.indexOf(MARK) : -1
  return i < 0 ? null : decodeURIComponent(url.slice(i + MARK.length).split('?')[0])
}

export function mediaPathsIn(steps = []) {
  const out = new Set()
  for (const s of steps) {
    const images = [...(s.b || '').matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((x) => x[1])
    ;[s.video, ...images].forEach((u) => { const p = pathOf(u); if (p) out.add(p) })
  }
  return out
}

export async function removeMedia(paths) {
  const list = [...new Set(paths)]
  if (!list.length) return
  const { error } = await supabase.storage.from('media').remove(list)
  if (error) console.error('Could not remove files:', error.message)
}
