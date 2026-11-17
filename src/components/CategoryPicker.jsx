import { useState } from 'react'

// Dropdown of existing categories with a "New category" button.
export default function CategoryPicker({ value, options, onChange }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [extra, setExtra] = useState([])
  const all = [...new Set([...options, ...extra, value].filter(Boolean))].sort((a, b) => a.localeCompare(b))

  function add() {
    const n = name.trim()
    if (!n) return
    const existing = all.find((c) => c.toLowerCase() === n.toLowerCase())
    if (!existing) setExtra((e) => [...e, n])
    onChange(existing || n)
    setName('')
    setAdding(false)
  }

  return adding ? (
    <div className="cat-row">
      <input autoFocus maxLength={60} placeholder="New category name" value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
      <button className="primary" onClick={add}>Add</button>
      <button className="ghost" onClick={() => { setAdding(false); setName('') }}>Cancel</button>
    </div>
  ) : (
    <div className="cat-row">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Category">
        <option value="" disabled>Choose a category</option>
        {all.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button onClick={() => setAdding(true)}>New category</button>
    </div>
  )
}
