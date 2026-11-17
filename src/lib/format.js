export const fmtTime = (mins) =>
  mins < 60 ? `${mins} min` : `${+(mins / 60).toFixed(1)} ${mins === 60 ? 'hour' : 'hours'}`

// Stages are the pathway's guides that learners can see (published), in order.
export function pathStats(pw, byId, progress) {
  const mods = pw.module_ids.map((id) => byId[id]).filter(Boolean)
  return {
    mods,
    done: mods.filter((m) => progress[m.id]?.done).length,
    mins: mods.reduce((a, m) => a + (m.mins || 0), 0)
  }
}
